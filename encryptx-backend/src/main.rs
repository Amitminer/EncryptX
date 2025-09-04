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
use actix_web::{App, HttpRequest, HttpResponse, HttpServer, Responder, get, post, web};
use clap::{Parser, Subcommand};
use std::sync::Arc;
pub mod cli;
pub mod constants;
pub mod crypto;
pub mod middleware;
pub mod service;
pub mod validation;
use constants::server::*;
use middleware::SecurityHeaders;
use service::*;
use validation::*;

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

/// File encryption endpoint supporting both key-based and password-based modes.
/// Mode is determined by presence of x-password header.
#[post("/encrypt")]
/// Handles file encryption requests for the `/encrypt` endpoint.
///
/// Supports both password-based and key-based encryption modes, determined by request headers.
/// Uses the service layer for business logic and validation.
///
/// # Returns
/// An encrypted file as a binary stream with appropriate headers, or an error response if encryption fails.
async fn encrypt_file(
    req: HttpRequest,
    body: Bytes,
    rate_limiter: web::Data<Arc<RateLimiter>>,
) -> impl Responder {
    // Check rate limit
    let client_ip = get_client_ip(&req);
    if !rate_limiter.check_rate_limit(&client_ip) {
        return HttpResponse::TooManyRequests()
            .body("Rate limit exceeded. Please try again later.");
    }
    match FileEncryptionService::encrypt_file(&req, body).await {
        Ok(result) => {
            let mut response = HttpResponse::Ok()
                .insert_header((CONTENT_TYPE, "application/octet-stream"))
                .insert_header((CONTENT_DISPOSITION, "attachment; filename=\"encrypted.xd\""))
                .body(result.encrypted_data);

            // Add generated key to response headers if available
            if let Some(generated_key) = result.generated_key {
                response.headers_mut().insert(
                    actix_web::http::header::HeaderName::from_static("x-generated-key"),
                    actix_web::http::header::HeaderValue::from_str(&generated_key).unwrap(),
                );
            }

            response
        }
        Err(e) => e.into(),
    }
}

/// File decryption endpoint with automatic format detection.
/// Detects password vs key-based encryption and routes accordingly.
#[post("/decrypt")]
/// Handles file decryption requests for the `/decrypt` endpoint.
///
/// Supports both password-based and key-based decryption modes, determined by request headers.
/// Uses the service layer for business logic and validation.
///
/// # Returns
/// The decrypted file as a binary stream with the original filename, or an error response if decryption fails.
async fn decrypt_file(
    req: HttpRequest,
    body: Bytes,
    rate_limiter: web::Data<Arc<RateLimiter>>,
) -> impl Responder {
    // Check rate limit
    let client_ip = get_client_ip(&req);
    if !rate_limiter.check_rate_limit(&client_ip) {
        return HttpResponse::TooManyRequests()
            .body("Rate limit exceeded. Please try again later.");
    }
    match FileEncryptionService::decrypt_file(&req, body).await {
        Ok(result) => HttpResponse::Ok()
            .insert_header((CONTENT_TYPE, "application/octet-stream"))
            .insert_header((
                CONTENT_DISPOSITION,
                format!("attachment; filename=\"{}\"", result.original_filename),
            ))
            .body(result.decrypted_data),
        Err(e) => e.into(),
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
    println!("Listening on http://0.0.0.0:8080");
    // Create rate limiter: 10 requests per minute per IP
    let rate_limiter = Arc::new(RateLimiter::new(10, 60));

    HttpServer::new(move || {
        let allowed_origins = std::env::var("ALLOWED_ORIGIN")
            .unwrap_or_else(|_| DEFAULT_CORS_ORIGIN.to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect::<Vec<_>>();

        App::new()
            .app_data(web::Data::new(rate_limiter.clone()))
            .app_data(web::PayloadConfig::new(MAX_FILE_SIZE)) // Use constant for max file size
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
                    .expose_headers(vec!["Content-Disposition", "x-generated-key"])
                    .max_age(3600) // Cache preflight requests for 1 hour
            })
            .wrap(SecurityHeaders) // Add security headers
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
