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
use clap::{Parser, Subcommand};
use rand::RngCore;
use rand::rngs::OsRng;
use zeroize::Zeroize;
use zstd::stream::{decode_all, encode_all};
pub mod cli;
pub mod crypto;

/// EncryptX Backend CLI
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Encrypt a file
    Encrypt {
        /// Path to the file to encrypt
        #[arg(long)]
        filename: String,
        /// Password to use for encryption (optional)
        #[arg(long)]
        pass: Option<String>,
        /// Key to use for encryption (base64, optional; if not provided, random key is generated)
        #[arg(long)]
        key: Option<String>,
    },
    /// Decrypt a file
    Decrypt {
        /// Path to the file to decrypt
        #[arg(long)]
        filename: String,
        /// Password to use for decryption (optional)
        #[arg(long)]
        pass: Option<String>,
        /// Key to use for decryption (base64, optional)
        #[arg(long)]
        key: Option<String>,
    },
}

/// Generates a cryptographically secure 256-bit encryption key.
/// Generates a cryptographically secure 256-bit (32-byte) random encryption key using the system's secure random number generator.
///
/// # Returns
/// A 32-byte array containing the generated encryption key.
///
/// # Panics
/// Panics if the system random number generator fails.
fn generate_secure_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    OsRng
        .try_fill_bytes(&mut key)
        .expect("Failed to generate secure key");
    key
}

/// File encryption endpoint supporting both key-based and password-based modes.
/// Mode is determined by presence of x-password header.
#[post("/encrypt")]
/// Handles file encryption requests for the `/encrypt` endpoint.
///
/// Supports both password-based and key-based encryption modes, determined by the presence of the `x-password` header.
/// - **Password-based encryption:** Requires an `x-password` header and derives a key using Argon2id with a random 32-byte salt. The original filename can be specified via the `x-orig-filename` header.
/// - **Key-based encryption:** Uses a base64-encoded 256-bit key from the `x-enc-key` header, or generates a secure random key if not provided. The original filename can be specified via the `x-orig-filename` header.
///
/// # Returns
/// An encrypted file as a binary stream with appropriate headers, or an error response if encryption fails or headers are invalid.
async fn encrypt_file(req: HttpRequest, body: Bytes) -> impl Responder {
    // Compress the file bytes before encryption
    let compressed = match encode_all(&body[..], 3) {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::InternalServerError().body(format!("Compression error: {e}"));
        }
    };
    // Add a header byte to indicate compression (0x01)
    let mut compressed_with_flag = Vec::with_capacity(1 + compressed.len());
    compressed_with_flag.push(0x01);
    compressed_with_flag.extend_from_slice(&compressed);

    // Check for password-based encryption request
    if let Some(password_header) = req.headers().get("x-password") {
        let password = match password_header.to_str() {
            Ok(p) => p.to_string(), // Need owned String for async operation
            Err(_) => return HttpResponse::BadRequest().body("Invalid password header encoding"),
        };

        // Generate random 32-byte salt for Argon2 key derivation
        let mut salt = [0u8; 32];
        OsRng
            .try_fill_bytes(&mut salt)
            .expect("Failed to fill salt");

        let orig_name = req
            .headers()
            .get("x-orig-filename")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("file.bin");

        println!("Encrypting file with password-based encryption: {orig_name}");

        // Use async encryption to avoid blocking the server thread
        match crypto::encrypt_with_password_async(
            &compressed_with_flag,
            password,
            orig_name,
            salt.to_vec(),
        )
        .await
        {
            Ok(encrypted) => HttpResponse::Ok()
                .insert_header((CONTENT_TYPE, "application/octet-stream"))
                .insert_header((CONTENT_DISPOSITION, "attachment; filename=\"encrypted.xd\""))
                .body(encrypted),
            Err(e) => HttpResponse::InternalServerError().body(format!("Encryption error: {e}")),
        }
    } else {
        // Key-based encryption mode
        let generate_and_log_key = || {
            let random_key = generate_secure_key();
            let key_b64_str = general_purpose::STANDARD.encode(random_key);
            println!("Generated random encryption key: {key_b64_str}");
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
                            .body(format!("Base64 decode error: {e}"));
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

        println!("Encrypting file with key-based encryption: {orig_name}");

        match crypto::encrypt_with_header(&compressed_with_flag, &final_key, orig_name) {
            Ok(encrypted) => {
                final_key.zeroize(); // Clear key from memory
                HttpResponse::Ok()
                    .insert_header((CONTENT_TYPE, "application/octet-stream"))
                    .insert_header((CONTENT_DISPOSITION, "attachment; filename=\"encrypted.xd\""))
                    .body(encrypted)
            }
            Err(e) => {
                final_key.zeroize();
                HttpResponse::InternalServerError().body(format!("Encryption error: {e}"))
            }
        }
    }
}

/// File decryption endpoint with automatic format detection.
/// Detects password vs key-based encryption and routes accordingly.
#[post("/decrypt")]
/// Handles file decryption requests for the `/decrypt` endpoint.
///
/// Supports both password-based and key-based decryption modes, determined by the presence of the `x-password` or `x-enc-key` headers. Returns the decrypted file as a binary stream with the original filename, or an appropriate HTTP error response if decryption fails.
async fn decrypt_file(req: HttpRequest, body: Bytes) -> impl Responder {
    // Check for password-based decryption request
    if let Some(password_header) = req.headers().get("x-password") {
        let password = match password_header.to_str() {
            Ok(p) => p.to_string(), // Need owned String for async operation
            Err(_) => return HttpResponse::BadRequest().body("Invalid password header encoding"),
        };

        // Use async decryption for Argon2 key derivation (CPU-intensive)
        match crypto::decrypt_with_password_async(&body, password).await {
            Ok((decrypted, filename)) => {
                // Check for compression flag
                if decrypted.first() == Some(&0x01) {
                    match decode_all(&decrypted[1..]) {
                        Ok(decompressed) => HttpResponse::Ok()
                            .insert_header((CONTENT_TYPE, "application/octet-stream"))
                            .insert_header((
                                CONTENT_DISPOSITION,
                                format!("attachment; filename=\"{filename}\""),
                            ))
                            .body(decompressed),
                        Err(e) => HttpResponse::InternalServerError()
                            .body(format!("Decompression error: {e}")),
                    }
                } else {
                    // No compression flag, return as is
                    HttpResponse::Ok()
                        .insert_header((CONTENT_TYPE, "application/octet-stream"))
                        .insert_header((
                            CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{filename}\""),
                        ))
                        .body(decrypted)
                }
            }
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
                    .body(format!("Async processing error: {msg}")),
                _ => HttpResponse::InternalServerError().body(format!("Decryption error: {e}")),
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
                            .body(format!("Base64 decode error: {e}"));
                    }
                }
            }
            None => None, // Will try to use embedded key from file header
        };

        let key_ref = key_opt.as_deref();
        match crypto::decrypt_with_header(&body, key_ref) {
            Ok((decrypted, filename)) => {
                // Check for compression flag
                if decrypted.first() == Some(&0x01) {
                    match decode_all(&decrypted[1..]) {
                        Ok(decompressed) => HttpResponse::Ok()
                            .insert_header((CONTENT_TYPE, "application/octet-stream"))
                            .insert_header((
                                CONTENT_DISPOSITION,
                                format!("attachment; filename=\"{filename}\""),
                            ))
                            .body(decompressed),
                        Err(e) => HttpResponse::InternalServerError()
                            .body(format!("Decompression error: {e}")),
                    }
                } else {
                    // No compression flag, return as is
                    HttpResponse::Ok()
                        .insert_header((CONTENT_TYPE, "application/octet-stream"))
                        .insert_header((
                            CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{filename}\""),
                        ))
                        .body(decrypted)
                }
            }
            Err(e) => match e {
                crypto::CryptoError::WrongDecryptionMethod(msg) => {
                    HttpResponse::BadRequest().body(msg)
                }
                crypto::CryptoError::AuthenticationError => {
                    HttpResponse::Unauthorized().body("Wrong key or file is corrupt")
                }
                crypto::CryptoError::FormatError => HttpResponse::BadRequest()
                    .body("Invalid file format. The file may be corrupt or not a valid .xd file."),
                _ => HttpResponse::InternalServerError().body(format!("Decryption error: {e}")),
            },
        }
    }
}

/// Health check endpoint for monitoring and status verification.
/// Returns a simple message indicating the API is running.
#[get("/health")]
/// Returns a JSON response indicating server health status and cryptographic configuration.
///
/// The response includes the server status, the cryptographic algorithms in use, and whether asynchronous processing is enabled.
async fn health_check() -> impl Responder {
    HttpResponse::Ok().body("EncryptX backend server api is running")
}

/// Main server entry point with CORS configuration and request logging.
#[actix_web::main]
/// Starts the EncryptX backend server with Actix Web, configuring CORS, logging, and REST endpoints for file encryption, decryption, and health checks.
///
/// Loads environment variables, sets up allowed CORS origins, and binds the server to all interfaces on port 8080. Supports large file uploads and logs all incoming requests.
///
/// # Returns
/// An I/O result indicating the success or failure of the server startup.
async fn main() -> std::io::Result<()> {
    #[cfg(feature = "dhat-heap")]
    let _profiler = dhat::Profiler::new_heap();
    dotenvy::dotenv().ok();
    if cli::run_cli().await? {
        return Ok(());
    }
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
                cors.allowed_methods(vec!["POST", "GET"])
                    .allowed_headers(vec![
                        "x-enc-key",
                        "x-password",
                        "x-orig-filename",
                        "content-type",
                    ])
                    .send_wildcard()
                    .expose_headers(vec!["Content-Disposition"])
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
