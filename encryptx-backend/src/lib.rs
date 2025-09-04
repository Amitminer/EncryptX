//! EncryptX Backend Library
//!
//! This library provides the core functionality for the EncryptX file encryption system.
//! It can be used both as a standalone library and as the backend for the EncryptX web application.
//!
//! # Modules
//! - `cli`: Command-line interface implementation
//! - `constants`: Application constants and configuration
//! - `crypto`: Core cryptographic operations
//! - `api`: High-level API for library consumers
//!
//! # Usage as Library
//! ```rust,no_run
//! use encryptx_backend::api::{encrypt_file_bytes, decrypt_file_bytes};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Encrypt with password
//!     let encrypted = encrypt_file_bytes(
//!         b"Hello, World!",
//!         Some("password123"),
//!         None,
//!         "hello.txt"
//!     ).await?;
//!
//!     // Decrypt with password
//!     let (decrypted, filename) = decrypt_file_bytes(
//!         &encrypted,
//!         Some("password123"),
//!         None
//!     ).await?;
//!     
//!     Ok(())
//! }
//! ```

pub mod cli;
pub mod constants;
pub mod crypto;

/// High-level API for library consumers.
///
/// This module provides simplified functions for encrypting and decrypting files
/// without needing to understand the internal service layer architecture.
/// Ideal for embedding EncryptX functionality in other applications.
pub mod api {
    use crate::constants::{compression::*, format::*};
    use crate::crypto;
    use rand::RngCore;
    use zstd::stream::{decode_all, encode_all};

    /// Encrypts file bytes with automatic compression and flexible authentication.
    ///
    /// This function provides a high-level interface for file encryption with automatic
    /// zstd compression applied before encryption. Supports both password-based and
    /// key-based encryption methods.
    ///
    /// # Parameters
    /// - `input`: The raw file data to encrypt
    /// - `password`: Optional password for Argon2id-based encryption
    /// - `key`: Optional 32-byte key for direct AES-256-GCM encryption
    /// - `filename`: Original filename to embed in the encrypted file
    ///
    /// # Returns
    /// The encrypted file data as `Vec<u8>` on success, or an error message
    ///
    /// # Encryption Methods
    /// - If `password` is provided: Uses Argon2id key derivation + AES-256-GCM
    /// - If `key` is provided: Uses direct AES-256-GCM encryption
    /// - If neither provided: Returns an error (use CLI for key generation)
    ///
    /// # Security Notes
    /// - Data is compressed with zstd before encryption for efficiency
    /// - Password-based encryption uses cryptographically secure salt generation
    /// - All encryption uses AES-256-GCM for authenticated encryption
    pub async fn encrypt_file_bytes(
        input: &[u8],
        password: Option<&str>,
        key: Option<&[u8]>,
        filename: &str,
    ) -> Result<Vec<u8>, String> {
        // Compress input
        let compressed = encode_all(input, ZSTD_COMPRESSION_LEVEL)
            .map_err(|e| format!("Compression error: {e}"))?;
        let mut compressed_with_flag = Vec::with_capacity(1 + compressed.len());
        compressed_with_flag.push(COMPRESSION_FLAG);
        compressed_with_flag.extend_from_slice(&compressed);

        if let Some(password) = password {
            // Password-based encryption
            let mut salt = [0u8; 32];
            rand::rngs::OsRng
                .try_fill_bytes(&mut salt)
                .map_err(|e| format!("Salt gen error: {e}"))?;
            crypto::encrypt_with_password_async(
                &compressed_with_flag,
                password.to_string(),
                filename,
                salt.to_vec(),
            )
            .await
            .map_err(|e| format!("Encryption error: {e}"))
        } else if let Some(key) = key {
            // Key-based encryption
            if key.len() != 32 {
                return Err("Key must be 32 bytes".to_string());
            }
            crypto::encrypt_with_header(&compressed_with_flag, key, filename)
                .map_err(|e| format!("Encryption error: {e}"))
        } else {
            Err("Must provide password or key".to_string())
        }
    }

    /// Decrypts file bytes with automatic decompression and format detection.
    ///
    /// This function provides a high-level interface for file decryption with automatic
    /// format detection and zstd decompression. Automatically determines whether the
    /// file was encrypted with password-based or key-based encryption.
    ///
    /// # Parameters
    /// - `input`: The encrypted file data to decrypt
    /// - `password`: Optional password for password-based decryption
    /// - `key`: Optional 32-byte key for key-based decryption
    ///
    /// # Returns
    /// A tuple containing the decrypted data and original filename on success,
    /// or an error message on failure
    ///
    /// # Decryption Methods
    /// - If `password` is provided: Attempts password-based decryption with Argon2id
    /// - If `key` is provided: Attempts key-based decryption with AES-256-GCM
    /// - Exactly one method must be provided
    ///
    /// # Security Notes
    /// - Automatically verifies file integrity using AES-GCM authentication
    /// - Decompresses data automatically if compression flag is detected
    /// - Returns original filename from encrypted file metadata
    pub async fn decrypt_file_bytes(
        input: &[u8],
        password: Option<&str>,
        key: Option<&[u8]>,
    ) -> Result<(Vec<u8>, String), String> {
        let (decrypted, filename) = if let Some(password) = password {
            crypto::decrypt_with_password_async(input, password.to_string())
                .await
                .map_err(|e| format!("Decryption error: {e}"))?
        } else {
            let key_ref = key;
            crypto::decrypt_with_header(input, key_ref)
                .map_err(|e| format!("Decryption error: {e}"))?
        };
        // Decompress if flagged
        if decrypted.first() == Some(&COMPRESSION_FLAG) {
            let decompressed =
                decode_all(&decrypted[1..]).map_err(|e| format!("Decompression error: {e}"))?;
            Ok((decompressed, filename))
        } else {
            Ok((decrypted, filename))
        }
    }
}
