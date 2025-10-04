//! Service layer for EncryptX backend
//!
//! This module provides business logic abstraction between HTTP handlers and crypto operations.
//! It handles file compression, encryption/decryption workflows, and error management.
//!
//! # Architecture
//! - `CompressionService`: Handles zstd compression/decompression with flags
//! - `EncryptionService`: Manages encryption operations (password and key-based)
//! - `DecryptionService`: Manages decryption operations with format detection
//! - `FileEncryptionService`: High-level orchestration of the complete workflow
//!
//! # Error Handling
//! All operations return `ServiceResult<T>` which automatically converts to appropriate HTTP responses.
//! Cryptographic errors are mapped to user-friendly messages while preserving security.

use crate::constants::{compression::*, format::*};
use crate::crypto::{self, CryptoError};
use crate::validation::{validate_file_size, validate_crypto_headers};
use actix_web::{HttpRequest, HttpResponse, web::Bytes};
use base64::Engine;
use rand::RngCore;
use zstd::stream::{decode_all, encode_all};

/// Result type for service operations
pub type ServiceResult<T> = Result<T, ServiceError>;

/// Comprehensive error types for service layer operations.
///
/// These errors provide structured error handling across the service layer,
/// allowing for appropriate HTTP status codes and user-friendly error messages.
/// Each variant maps to specific HTTP responses in the `From<ServiceError>` implementation.
#[derive(Debug)]
pub enum ServiceError {
    Validation(String),
    Crypto(CryptoError),
    Compression(String),
    Internal(String),
}

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Validation(msg) => write!(f, "Validation error: {}", msg),
            ServiceError::Crypto(err) => write!(f, "Cryptographic error: {}", err),
            ServiceError::Compression(msg) => write!(f, "Compression error: {}", msg),
            ServiceError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for ServiceError {}

impl From<CryptoError> for ServiceError {
    fn from(error: CryptoError) -> Self {
        ServiceError::Crypto(error)
    }
}

/// Converts ServiceError to appropriate HTTP response with security-conscious error messages.
///
/// Maps service errors to HTTP status codes and user-friendly messages while avoiding
/// information leakage that could aid attackers. Authentication errors are deliberately
/// generic to prevent distinguishing between wrong passwords and corrupted files.
impl From<ServiceError> for HttpResponse {
    fn from(error: ServiceError) -> Self {
        match error {
            ServiceError::Validation(msg) => HttpResponse::BadRequest().body(msg),
            ServiceError::Crypto(CryptoError::AuthenticationError) => HttpResponse::Unauthorized()
                .body("Authentication failed - wrong password/key or corrupted file"),
            ServiceError::Crypto(CryptoError::WrongDecryptionMethod(msg)) => {
                HttpResponse::BadRequest().body(msg)
            }
            ServiceError::Crypto(CryptoError::FormatError) => {
                HttpResponse::BadRequest().body("Invalid file format or corrupted data")
            }
            ServiceError::Crypto(err) => HttpResponse::InternalServerError()
                .body(format!("Encryption/decryption failed: {}", err)),
            ServiceError::Compression(msg) => HttpResponse::InternalServerError()
                .body(format!("Compression/decompression failed: {}", msg)),
            ServiceError::Internal(msg) => {
                HttpResponse::InternalServerError().body(format!("Internal server error: {}", msg))
            }
        }
    }
}

/// Container for compressed file data with compression statistics.
///
/// Tracks both original and compressed sizes for monitoring compression efficiency
/// and providing user feedback about space savings.
#[derive(Debug)]
pub struct CompressedData {
    pub data: Vec<u8>,
    pub original_size: usize,
    pub compressed_size: usize,
}

/// Result of encryption operation with optional key generation.
///
/// Contains the encrypted data and optionally a generated key (base64 encoded)
/// if the encryption was performed without a user-provided key.
#[derive(Debug)]
pub struct EncryptionResult {
    pub encrypted_data: Vec<u8>,
    pub generated_key: Option<String>, // Base64 encoded key if generated
}

/// Result of decryption operation with file metadata.
///
/// Contains the decrypted data, original filename from the encrypted file header,
/// and the final decompressed size for user feedback.
#[derive(Debug)]
pub struct DecryptionResult {
    pub decrypted_data: Vec<u8>,
    pub original_filename: String,
    pub decompressed_size: usize,
}

/// Service for file compression operations using zstd algorithm.
///
/// Provides compression and decompression with automatic flag detection.
/// Uses zstd for fast compression with good ratios, suitable for real-time operations.
pub struct CompressionService;

impl CompressionService {
    /// Compresses data with zstd and adds compression flag.
    ///
    /// Applies zstd compression at the configured level and prepends a compression flag
    /// byte to indicate the data is compressed. This allows the decompression function
    /// to automatically detect and handle compressed data.
    ///
    /// # Parameters
    /// - `data`: The raw data to compress
    ///
    /// # Returns
    /// `CompressedData` containing the compressed bytes with flag, original size, and compressed size
    ///
    /// # Errors
    /// Returns `ServiceError::Validation` for empty data or `ServiceError::Compression` if zstd fails
    pub fn compress(data: &[u8]) -> ServiceResult<CompressedData> {
        if data.is_empty() {
            return Err(ServiceError::Validation(
                "Cannot compress empty data".to_string(),
            ));
        }

        let original_size = data.len();
        let compressed = encode_all(data, ZSTD_COMPRESSION_LEVEL)
            .map_err(|e| ServiceError::Compression(format!("zstd compression failed: {}", e)))?;

        // Add compression flag
        let mut compressed_with_flag = Vec::with_capacity(1 + compressed.len());
        compressed_with_flag.push(COMPRESSION_FLAG);
        compressed_with_flag.extend_from_slice(&compressed);

        let compressed_size = compressed_with_flag.len();
        Ok(CompressedData {
            data: compressed_with_flag,
            original_size,
            compressed_size,
        })
    }

    /// Decompresses data if compression flag is present.
    ///
    /// Automatically detects if data is compressed by checking for the compression flag
    /// byte at the beginning. If present, removes the flag and decompresses the remaining
    /// data using zstd. If no flag is present, returns the data unchanged.
    ///
    /// # Parameters
    /// - `data`: The potentially compressed data with or without compression flag
    ///
    /// # Returns
    /// The decompressed data as a `Vec<u8>`
    ///
    /// # Errors
    /// Returns `ServiceError::Validation` for empty data or `ServiceError::Compression` if zstd decompression fails
    pub fn decompress(data: &[u8]) -> ServiceResult<Vec<u8>> {
        if data.is_empty() {
            return Err(ServiceError::Validation(
                "Cannot decompress empty data".to_string(),
            ));
        }

        if data[0] == COMPRESSION_FLAG {
            decode_all(&data[1..])
                .map_err(|e| ServiceError::Compression(format!("zstd decompression failed: {}", e)))
        } else {
            // No compression flag, return as-is
            Ok(data.to_vec())
        }
    }
}

/// Service for encryption operations supporting both password and key-based methods.
///
/// Handles the encryption workflow including salt generation for password-based encryption
/// and random key generation for key-based encryption when no key is provided.
pub struct EncryptionService;

impl EncryptionService {
    /// Encrypts data using password-based encryption with Argon2id key derivation.
    ///
    /// Uses Argon2id to derive a 256-bit key from the password and a random salt,
    /// then encrypts the data using AES-256-GCM. The salt and encryption parameters
    /// are embedded in the file header for future decryption.
    ///
    /// # Parameters
    /// - `data`: The data to encrypt (should be pre-compressed)
    /// - `password`: The password for key derivation
    /// - `filename`: Original filename to embed in the encrypted file header
    ///
    /// # Returns
    /// `EncryptionResult` with encrypted data (no generated key for password-based encryption)
    ///
    /// # Errors
    /// Returns `ServiceError::Internal` for salt generation failures or `ServiceError::Crypto` for encryption failures
    pub async fn encrypt_with_password(
        data: &[u8],
        password: String,
        filename: &str,
    ) -> ServiceResult<EncryptionResult> {
        // Generate random salt
        let mut salt = [0u8; 32];
        rand::rngs::OsRng
            .try_fill_bytes(&mut salt)
            .map_err(|e| ServiceError::Internal(format!("Failed to generate salt: {}", e)))?;

        let encrypted_data =
            crypto::encrypt_with_password_async(data, password, filename, salt.to_vec()).await?;

        Ok(EncryptionResult {
            encrypted_data,
            generated_key: None,
        })
    }

    /// Encrypts data using key-based encryption with AES-256-GCM.
    ///
    /// If a key is provided, uses it directly for encryption. If no key is provided,
    /// generates a cryptographically secure random 256-bit key and returns it base64-encoded
    /// in the result for the user to save.
    ///
    /// # Parameters
    /// - `data`: The data to encrypt (should be pre-compressed)
    /// - `key`: Optional 32-byte encryption key. If None, a random key is generated
    /// - `filename`: Original filename to embed in the encrypted file header
    ///
    /// # Returns
    /// `EncryptionResult` with encrypted data and optionally the generated key (base64)
    ///
    /// # Errors
    /// Returns `ServiceError::Internal` for key generation failures or `ServiceError::Crypto` for encryption failures
    pub fn encrypt_with_key(
        data: &[u8],
        key: Option<&[u8]>,
        filename: &str,
    ) -> ServiceResult<EncryptionResult> {
        let (final_key, generated_key_b64) = if let Some(key) = key {
            (key.to_vec(), None)
        } else {
            // Generate random key
            let mut k = [0u8; 32];
            rand::rngs::OsRng
                .try_fill_bytes(&mut k)
                .map_err(|e| ServiceError::Internal(format!("Failed to generate key: {}", e)))?;

            let key_b64 = base64::engine::general_purpose::STANDARD.encode(k);
            (k.to_vec(), Some(key_b64))
        };

        let encrypted_data = crypto::encrypt_with_header(data, &final_key, filename)?;

        Ok(EncryptionResult {
            encrypted_data,
            generated_key: generated_key_b64,
        })
    }
}

/// Service for decryption operations
pub struct DecryptionService;

impl DecryptionService {
    /// Decrypts data using password-based decryption
    pub async fn decrypt_with_password(
        data: &[u8],
        password: String,
    ) -> ServiceResult<DecryptionResult> {
        let (decrypted_data, filename) =
            crypto::decrypt_with_password_async(data, password).await?;
        let decompressed = CompressionService::decompress(&decrypted_data)?;
        let decompressed_size = decompressed.len();

        Ok(DecryptionResult {
            decrypted_data: decompressed,
            original_filename: filename,
            decompressed_size,
        })
    }

    /// Decrypts data using key-based decryption
    pub fn decrypt_with_key(data: &[u8], key: Option<&[u8]>) -> ServiceResult<DecryptionResult> {
        let (decrypted_data, filename) = crypto::decrypt_with_header(data, key)?;
        let decompressed = CompressionService::decompress(&decrypted_data)?;
        let decompressed_size = decompressed.len();

        Ok(DecryptionResult {
            decrypted_data: decompressed,
            original_filename: filename,
            decompressed_size,
        })
    }
}

/// High-level file encryption service
pub struct FileEncryptionService;

impl FileEncryptionService {
    /// Encrypts file data with validation and compression
    pub async fn encrypt_file(req: &HttpRequest, body: Bytes) -> ServiceResult<EncryptionResult> {
        // Validate file size
        validate_file_size(body.len()).map_err(|e| ServiceError::Validation(e.to_string()))?;

        // Validate and extract headers
        let (password, key, filename) = validate_crypto_headers(req)
            .map_err(|e| {
                // Extract the error message from the HttpResponse
                let error_msg = match e.status() {
                    actix_web::http::StatusCode::BAD_REQUEST => {
                        // Try to extract the body content for more specific error
                        "Invalid request headers - check your password, encryption key, or filename format"
                    },
                    _ => "Invalid request headers"
                };
                ServiceError::Validation(error_msg.to_string())
            })?;

        // Compress the data
        let compressed = CompressionService::compress(&body)?;

        println!("File encryption started: {}", filename);
        println!("Original size: {} bytes", compressed.original_size);
        println!("Compressed size: {} bytes", compressed.compressed_size);

        // Encrypt based on method
        let result = if let Some(password) = password {
            EncryptionService::encrypt_with_password(&compressed.data, password, &filename).await?
        } else {
            EncryptionService::encrypt_with_key(&compressed.data, key.as_deref(), &filename)?
        };

        if let Some(ref generated_key) = result.generated_key {
            println!("Generated encryption key: {}", generated_key);
            println!("⚠️  Save this key securely! It will not be shown again.");
        }

        println!("Encryption completed successfully");
        Ok(result)
    }

    /// Decrypts file data with validation and decompression
    pub async fn decrypt_file(req: &HttpRequest, body: Bytes) -> ServiceResult<DecryptionResult> {
        // Validate file size
        validate_file_size(body.len()).map_err(|e| ServiceError::Validation(e.to_string()))?;

        // Validate and extract headers
        let (password, key, _) = validate_crypto_headers(req)
            .map_err(|e| {
                // Extract the error message from the HttpResponse
                let error_msg = match e.status() {
                    actix_web::http::StatusCode::BAD_REQUEST => {
                        // Try to extract the body content for more specific error
                        "Invalid request headers - check your password, encryption key, or filename format"
                    },
                    _ => "Invalid request headers"
                };
                ServiceError::Validation(error_msg.to_string())
            })?;

        // Ensure at least one decryption method is provided
        if password.is_none() && key.is_none() {
            return Err(ServiceError::Validation(
                "Either password or key must be provided for decryption".to_string(),
            ));
        }

        println!("File decryption started");

        // Decrypt based on method
        let result = if let Some(password) = password {
            DecryptionService::decrypt_with_password(&body, password).await?
        } else {
            DecryptionService::decrypt_with_key(&body, key.as_deref())?
        };

        println!("Decryption completed: {}", result.original_filename);
        println!("Decompressed size: {} bytes", result.decompressed_size);

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compression_service() {
        let data = b"Hello, World! This is test data for compression.";

        let compressed = CompressionService::compress(data).unwrap();
        assert!(compressed.compressed_size > 0);
        assert_eq!(compressed.original_size, data.len());

        let decompressed = CompressionService::decompress(&compressed.data).unwrap();
        assert_eq!(decompressed, data);
    }

    #[test]
    fn test_compression_empty_data() {
        assert!(CompressionService::compress(&[]).is_err());
        assert!(CompressionService::decompress(&[]).is_err());
    }

    #[test]
    fn test_service_error_conversion() {
        let validation_error = ServiceError::Validation("test error".to_string());
        let response: HttpResponse = validation_error.into();
        assert_eq!(response.status(), actix_web::http::StatusCode::BAD_REQUEST);
    }
}
