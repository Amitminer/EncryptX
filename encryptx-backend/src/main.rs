//! EncryptX Backend - File Encryption API Server
//!
//! REST API for secure file encryption/decryption using Actix Web.
//! Supports both key-based and password-based encryption with AES-256-GCM.
//!
//! Endpoints:
//! - POST /encrypt: Encrypts uploaded file data
//! - POST /decrypt: Decrypts .xd file and returns original content
//! - GET /health: Server status and crypto info
//!
//! Security approach:
//! - AES-256-GCM for authenticated encryption (prevents tampering)
//! - Argon2id for password-based key derivation (GPU-resistant)
//! - Async processing to keep server responsive under load
//! - Memory-safe key handling with automatic cleanup
//! - Cryptographically secure random number generation

use actix_cors::Cors;
use actix_web::http::header::{CONTENT_DISPOSITION, CONTENT_TYPE};
use actix_web::web::Bytes;
use actix_web::{App, HttpRequest, HttpResponse, HttpServer, Responder, get, post};
use base64::{Engine as _, engine::general_purpose};
use rand::TryRngCore;
use rand::rngs::OsRng;
use zeroize::Zeroize;
mod crypto;

/// Generates a cryptographically secure 256-bit encryption key.
/// Uses the system's secure random number generator.
fn generate_secure_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    OsRng.try_fill_bytes(&mut key).expect("Failed to generate secure key");
    key
}

/// File encryption endpoint supporting both key-based and password-based modes.
/// Mode is determined by presence of x-password header.
#[post("/encrypt")]
async fn encrypt_file(req: HttpRequest, body: Bytes) -> impl Responder {
    // Check for password-based encryption request
    if let Some(password_header) = req.headers().get("x-password") {
        let password = match password_header.to_str() {
            Ok(p) => p.to_string(), // Need owned String for async operation
            Err(_) => return HttpResponse::BadRequest().body("Invalid password header encoding"),
        };

        // Generate random 32-byte salt for Argon2 key derivation
        let mut salt = [0u8; 32];
        OsRng.try_fill_bytes(&mut salt).expect("Failed to fill salt");

        let orig_name = req
            .headers()
            .get("x-orig-filename")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("file.bin");

        println!(
            "Encrypting file with password-based encryption: {}",
            orig_name
        );

        // Use async encryption to avoid blocking the server thread
        match crypto::encrypt_with_password_async(&body, password, orig_name, salt.to_vec()).await {
            Ok(encrypted) => {
                HttpResponse::Ok()
                    .insert_header((CONTENT_TYPE, "application/octet-stream"))
                    .insert_header((CONTENT_DISPOSITION, "attachment; filename=\"encrypted.xd\""))
                    .body(encrypted)
            }
            Err(e) => {
                HttpResponse::InternalServerError().body(format!("Encryption error: {}", e))
            }
        }
    } else {
        // Key-based encryption mode
        let generate_and_log_key = || {
            let random_key = generate_secure_key();
            let key_b64_str = general_purpose::STANDARD.encode(&random_key);
            println!("Generated random encryption key: {}", key_b64_str);
            random_key
        };

        let mut final_key = if let Some(val) = req.headers().get("x-enc-key") {
            let key_b64 = val.to_str().unwrap_or("");
            if key_b64.is_empty() {
                // No key provided, generate a secure random one
                generate_and_log_key()
            } else {
                // Decode provided base64 key
                match general_purpose::STANDARD.decode(key_b64) {
                    Ok(k) if k.len() == 32 => {
                        let mut arr = [0u8; 32];
                        arr.copy_from_slice(&k);
                        arr
                    }
                    Ok(k) => {
                        return HttpResponse::BadRequest().body(format!(
                            "Key is {} bytes after base64 decode, expected 32",
                            k.len()
                        ));
                    }
                    Err(e) => {
                        return HttpResponse::BadRequest()
                            .body(format!("Base64 decode error: {}", e));
                    }
                }
            }
        } else {
            // No key header at all, generate random key
            generate_and_log_key()
        };

        let orig_name = req
            .headers()
            .get("x-orig-filename")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("file.bin");

        println!("Encrypting file with key-based encryption: {}", orig_name);

        match crypto::encrypt_with_header(&body, &final_key, orig_name) {
            Ok(encrypted) => {
                final_key.zeroize(); // Clear key from memory
                HttpResponse::Ok()
                    .insert_header((CONTENT_TYPE, "application/octet-stream"))
                    .insert_header((CONTENT_DISPOSITION, "attachment; filename=\"encrypted.xd\""))
                    .body(encrypted)
            }
            Err(e) => {
                final_key.zeroize();
                HttpResponse::InternalServerError().body(format!("Encryption error: {}", e))
            }
        }
    }
}

/// File decryption endpoint with automatic format detection.
/// Detects password vs key-based encryption and routes accordingly.
#[post("/decrypt")]
async fn decrypt_file(req: HttpRequest, body: Bytes) -> impl Responder {
    // Check for password-based decryption request
    if let Some(password_header) = req.headers().get("x-password") {
        let password = match password_header.to_str() {
            Ok(p) => p.to_string(), // Need owned String for async operation
            Err(_) => return HttpResponse::BadRequest().body("Invalid password header encoding"),
        };

        // Use async decryption for Argon2 key derivation (CPU-intensive)
        match crypto::decrypt_with_password_async(&body, password).await {
            Ok((decrypted, filename)) => HttpResponse::Ok()
                .insert_header((CONTENT_TYPE, "application/octet-stream"))
                .insert_header((
                    CONTENT_DISPOSITION,
                    format!("attachment; filename=\"{}\"", filename),
                ))
                .body(decrypted),
            Err(e) => match e {
                crypto::CryptoError::WrongDecryptionMethod(msg) => {
                    HttpResponse::BadRequest().body(msg)
                }
                crypto::CryptoError::AuthenticationError => {
                    HttpResponse::Unauthorized().body("Wrong password or file is corrupt")
                }
                crypto::CryptoError::FormatError => HttpResponse::BadRequest()
                    .body("Invalid file format. The file may be corrupt or not a valid .xd file."),
                crypto::CryptoError::AsyncError(msg) => HttpResponse::InternalServerError()
                    .body(format!("Async processing error: {}", msg)),
                _ => HttpResponse::InternalServerError().body(format!("Decryption error: {}", e)),
            },
        }
    } else {
        // Key-based decryption mode
        let key_opt = match req.headers().get("x-enc-key") {
            Some(val) => {
                let key_b64 = val.to_str().unwrap_or("");
                match general_purpose::STANDARD.decode(key_b64) {
                    Ok(k) if k.len() == 32 => Some(k),
                    Ok(k) => {
                        return HttpResponse::BadRequest().body(format!(
                            "Key is {} bytes after base64 decode, expected 32",
                            k.len()
                        ));
                    }
                    Err(e) => {
                        return HttpResponse::BadRequest()
                            .body(format!("Base64 decode error: {}", e));
                    }
                }
            }
            None => None, // Will try to use embedded key from file header
        };

        let key_ref = key_opt.as_deref();
        match crypto::decrypt_with_header(&body, key_ref) {
            Ok((decrypted, filename)) => HttpResponse::Ok()
                .insert_header((CONTENT_TYPE, "application/octet-stream"))
                .insert_header((
                    CONTENT_DISPOSITION,
                    format!("attachment; filename=\"{}\"", filename),
                ))
                .body(decrypted),
            Err(e) => match e {
                crypto::CryptoError::WrongDecryptionMethod(msg) => {
                    HttpResponse::BadRequest().body(msg)
                }
                crypto::CryptoError::AuthenticationError => {
                    HttpResponse::Unauthorized().body("Wrong key or file is corrupt")
                }
                crypto::CryptoError::FormatError => HttpResponse::BadRequest()
                    .body("Invalid file format. The file may be corrupt or not a valid .xd file."),
                _ => HttpResponse::InternalServerError().body(format!("Decryption error: {}", e)),
            },
        }
    }
}

/// Health check endpoint for monitoring and status verification.
/// Returns server status and cryptographic configuration info.
#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "crypto": "Argon2id + AES-256-GCM",
        "async": true
    }))
}

/// Main server entry point with CORS configuration and request logging.
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    println!("Starting EncryptX Backend Server...");
    println!("Listening on http://127.0.0.1:8080");

    HttpServer::new(|| {
        let allowed_origins = std::env::var("ALLOWED_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect::<Vec<_>>();

        App::new()
            .app_data(actix_web::web::PayloadConfig::new(1024 * 1024 * 1024)) // 1GB max file size
            .wrap({
                let mut cors = Cors::default();
                for origin in &allowed_origins {
                    cors = cors.allowed_origin(origin);
                }
                cors
                    .allowed_methods(vec!["POST", "GET"])
                    .allowed_headers(vec![
                        "x-enc-key",
                        "x-password",
                        "x-orig-filename",
                        "content-type",
                    ])
                    .send_wildcard()
                    .expose_headers(vec!["Content-Disposition"]) // Allow frontend to read filename
                    .supports_credentials()
            })
            .wrap(
                actix_web::middleware::Logger::default(), // Log all requests
            )
            .service(encrypt_file)
            .service(decrypt_file)
            .service(health_check)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}