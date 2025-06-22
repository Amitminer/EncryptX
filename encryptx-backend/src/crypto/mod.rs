use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use thiserror::Error;
use zeroize::ZeroizeOnDrop;
use serde::{Serialize, Deserialize};
use base64::engine::Engine;
use argon2::{Argon2, password_hash::{PasswordHasher, SaltString}, Algorithm, Version, Params};
use tokio::task;

/// Error types for cryptographic operations in EncryptX.
/// These cover all failure modes from key derivation to authentication failures.
#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionError(String),
    #[error("Decryption failed: {0}")]
    DecryptionError(String),
    #[error("Key derivation failed: {0}")]
    KeyDerivationError(String),
    #[error("Authentication failed - file may be tampered")]
    AuthenticationError,
    #[error("Invalid file format or wrong decryption method")]
    FormatError,
    #[error("Wrong decryption method: {0}")]
    WrongDecryptionMethod(String),
    #[error("Async task error: {0}")]
    AsyncError(String),
}

/// Memory-safe key container that automatically zeros on drop.
/// This prevents keys from lingering in memory after use, reducing attack surface.
#[derive(ZeroizeOnDrop)]
pub struct SecureKey {
    key: [u8; 32],
}

impl SecureKey {
    pub fn new(key: [u8; 32]) -> Self {
        Self { key }
    }
    
    pub fn as_slice(&self) -> &[u8] {
        &self.key
    }
}

/// File header for standard key-based encryption.
/// Contains metadata and optionally embeds the key for convenience.
#[derive(Serialize, Deserialize)]
pub struct XdHeader {
    pub filename: String,
    pub key: Option<String>,
    /// Format version for backward compatibility
    pub version: u8,
    /// Unix timestamp when file was encrypted
    pub timestamp: u64,
}

/// File header for password-based encryption with Argon2 key derivation.
/// Stores all parameters needed to reproduce the key derivation process.
#[derive(Serialize, Deserialize)]
pub struct XdPasswordHeader {
    pub filename: String,
    /// Argon2 salt encoded in base64
    pub salt: String,
    /// Key derivation function used ("argon2id" or "pbkdf2")
    pub kdf: String,
    /// Argon2 memory cost in KB - affects both security and performance
    pub memory_cost: Option<u32>,
    /// Argon2 time cost (number of iterations)
    pub time_cost: Option<u32>,
    /// Argon2 parallelism factor
    pub parallelism: Option<u32>,
    /// PBKDF2 iterations for backward compatibility with older files
    pub iterations: Option<u32>,
    /// Format version
    pub version: u8,
    /// Unix timestamp when file was encrypted
    pub timestamp: u64,
}

/// Argon2 parameters chosen for good security/performance balance.
/// 64MB memory usage prevents efficient GPU attacks while staying reasonable for most systems.
const ARGON2_MEMORY_COST: u32 = 65536; // 64 MB
const ARGON2_TIME_COST: u32 = 3;       // 3 iterations
const ARGON2_PARALLELISM: u32 = 1;     // Single thread to avoid complexity
const SALT_LENGTH: usize = 32;

/// Derives encryption key from password using Argon2 in async context.
/// Offloads CPU-intensive work to blocking thread pool to avoid blocking async runtime.
pub async fn derive_key_from_password_async(password: String, salt: Vec<u8>) -> Result<[u8; 32], CryptoError> {
    if salt.len() != SALT_LENGTH {
        return Err(CryptoError::KeyDerivationError("Invalid salt length".to_string()));
    }
    
    // Run Argon2 computation in blocking task since it's CPU-intensive
    let key = task::spawn_blocking(move || {
        derive_key_from_password_argon2(&password, &salt)
    }).await
    .map_err(|e| CryptoError::AsyncError(format!("Async task join error: {}", e)))??;
    
    Ok(key)
}

/// Synchronous Argon2 key derivation using Argon2id variant.
/// Argon2id combines data-dependent and data-independent memory access patterns.
pub fn derive_key_from_password_argon2(password: &str, salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    if salt.len() != SALT_LENGTH {
        return Err(CryptoError::KeyDerivationError("Invalid salt length".to_string()));
    }
    
    // Configure Argon2 with security-focused parameters
    let params = Params::new(
        ARGON2_MEMORY_COST, // memory cost (64 MB)
        ARGON2_TIME_COST,   // time cost (3 iterations)
        ARGON2_PARALLELISM, // parallelism (1 thread)
        Some(32)            // output length matches AES-256 key size
    ).map_err(|e| CryptoError::KeyDerivationError(format!("Argon2 params error: {}", e)))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    // Convert raw salt bytes to the format expected by argon2 crate
    let salt_string = SaltString::encode_b64(salt)
        .map_err(|e| CryptoError::KeyDerivationError(format!("Salt encoding error: {}", e)))?;
    
    let hash = argon2.hash_password(password.as_bytes(), &salt_string)
        .map_err(|e| CryptoError::KeyDerivationError(format!("Argon2 hashing error: {}", e)))?;
    
    let hash_value = hash.hash.unwrap();
    let hash_bytes = hash_value.as_bytes();
    if hash_bytes.len() < 32 {
        return Err(CryptoError::KeyDerivationError("Hash too short".to_string()));
    }
    
    let mut key = [0u8; 32];
    key.copy_from_slice(&hash_bytes[..32]);
    Ok(key)
}

/// Encrypts data with provided key using AES-256-GCM authenticated encryption.
/// Returns complete file format: [header_len][header][nonce][ciphertext_with_tag]
pub fn encrypt_with_header(data: &[u8], key: &[u8], filename: &str) -> Result<Vec<u8>, CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::EncryptionError("Key must be exactly 32 bytes".to_string()));
    }

    let secure_key = SecureKey::new({
        let mut k = [0u8; 32];
        k.copy_from_slice(key);
        k
    });

    let cipher = Aes256Gcm::new_from_slice(secure_key.as_slice())
        .map_err(|_| CryptoError::EncryptionError("Failed to initialize AES-256-GCM cipher".to_string()))?;

    // Generate cryptographically secure random nonce for this encryption
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    // AES-GCM provides both confidentiality and authenticity
    let ciphertext = cipher
        .encrypt(&nonce, data)
        .map_err(|_| CryptoError::EncryptionError("Authenticated encryption failed".to_string()))?;

    let header = XdHeader {
        filename: filename.to_string(),
        key: Some(base64::engine::general_purpose::STANDARD.encode(key)),
        version: 2,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    };

    let header_json = serde_json::to_vec(&header)
        .map_err(|_| CryptoError::EncryptionError("Header serialization failed".to_string()))?;

    // Construct file format: length prefix allows parsing without knowing header size
    let header_len = (header_json.len() as u32).to_be_bytes();
    let mut result = Vec::with_capacity(4 + header_json.len() + 12 + ciphertext.len());
    result.extend_from_slice(&header_len);
    result.extend_from_slice(&header_json);
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Encrypts data with password-based key derivation using Argon2.
/// Uses different file format marker (0xFF) to distinguish from key-based encryption.
pub async fn encrypt_with_password_async(data: &[u8], password: String, filename: &str, salt: Vec<u8>) -> Result<Vec<u8>, CryptoError> {
    // Derive 256-bit key from password using Argon2
    let derived_key = derive_key_from_password_async(password, salt.clone()).await?;
    
    let secure_key = SecureKey::new(derived_key);

    let cipher = Aes256Gcm::new_from_slice(secure_key.as_slice())
        .map_err(|_| CryptoError::EncryptionError("Failed to initialize AES-256-GCM cipher".to_string()))?;

    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    let ciphertext = cipher
        .encrypt(&nonce, data)
        .map_err(|_| CryptoError::EncryptionError("Password-based encryption failed".to_string()))?;

    let header = XdPasswordHeader {
        filename: filename.to_string(),
        salt: base64::engine::general_purpose::STANDARD.encode(&salt),
        kdf: "argon2id".to_string(),
        memory_cost: Some(ARGON2_MEMORY_COST),
        time_cost: Some(ARGON2_TIME_COST),
        parallelism: Some(ARGON2_PARALLELISM),
        iterations: None, // Not applicable for Argon2
        version: 3, // Version 3 indicates Argon2 usage
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    };

    let header_json = serde_json::to_vec(&header)
        .map_err(|_| CryptoError::EncryptionError("Password header serialization failed".to_string()))?;

    // Password-based files start with 0xFF marker for easy identification
    let header_len = (header_json.len() as u32).to_be_bytes();
    let mut result = Vec::with_capacity(1 + 4 + header_json.len() + 12 + ciphertext.len());
    result.push(0xFF); // Magic byte identifying password-based encryption
    result.extend_from_slice(&header_len);
    result.extend_from_slice(&header_json);
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Decrypts key-based encrypted files with authentication verification.
/// Automatically detects and rejects password-based files.
pub fn decrypt_with_header(encrypted_data: &[u8], key: Option<&[u8]>) -> Result<(Vec<u8>, String), CryptoError> {
    if encrypted_data.len() < 4 {
        return Err(CryptoError::FormatError);
    }

    // Detect password-based format and provide helpful error
    if encrypted_data[0] == 0xFF {
        return Err(CryptoError::WrongDecryptionMethod("This is a password-encrypted file. A password is required for decryption.".to_string()));
    }

    let header_len = u32::from_be_bytes([
        encrypted_data[0], encrypted_data[1], encrypted_data[2], encrypted_data[3]
    ]) as usize;

    if encrypted_data.len() < 4 + header_len + 12 {
        return Err(CryptoError::FormatError);
    }

    let header_json = &encrypted_data[4..4+header_len];
    let header: XdHeader = serde_json::from_slice(header_json)
        .map_err(|_| CryptoError::DecryptionError("Invalid or corrupted header".to_string()))?;

    let nonce = &encrypted_data[4+header_len..4+header_len+12];
    let ciphertext = &encrypted_data[4+header_len+12..];

    // Use provided key or fall back to embedded key from header
    let final_key = if let Some(k) = key {
        if k.len() != 32 {
            return Err(CryptoError::DecryptionError("Key must be exactly 32 bytes".to_string()));
        }
        k.to_vec()
    } else if let Some(key_b64) = &header.key {
        base64::engine::general_purpose::STANDARD.decode(key_b64)
            .map_err(|_| CryptoError::DecryptionError("Invalid embedded key format".to_string()))?
    } else {
        return Err(CryptoError::DecryptionError("No decryption key available".to_string()));
    };

    if final_key.len() != 32 {
        return Err(CryptoError::DecryptionError("Invalid key length".to_string()));
    }

    let secure_key = SecureKey::new({
        let mut k = [0u8; 32];
        k.copy_from_slice(&final_key);
        k
    });

    let cipher = Aes256Gcm::new_from_slice(secure_key.as_slice())
        .map_err(|_| CryptoError::DecryptionError("Failed to create cipher".to_string()))?;

    // AES-GCM automatically verifies authenticity during decryption
    let decrypted_data = cipher
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| CryptoError::AuthenticationError)?;

    Ok((decrypted_data, header.filename))
}

/// Decrypts password-based encrypted files using Argon2 key derivation.
/// Automatically detects key-based files and provides helpful error messages.
pub async fn decrypt_with_password_async(encrypted_data: &[u8], password: String) -> Result<(Vec<u8>, String), CryptoError> {
    if encrypted_data.is_empty() {
        return Err(CryptoError::FormatError);
    }

    // Ensure this is actually a password-based file
    if encrypted_data[0] != 0xFF {
        return Err(CryptoError::WrongDecryptionMethod("This file was not encrypted with a password. Please decrypt without providing a password.".to_string()));
    }

    if encrypted_data.len() < 5 {
        return Err(CryptoError::FormatError);
    }

    let header_len = u32::from_be_bytes([
        encrypted_data[1], encrypted_data[2], encrypted_data[3], encrypted_data[4]
    ]) as usize;

    if encrypted_data.len() < 5 + header_len + 12 {
        return Err(CryptoError::FormatError);
    }

    let header_json = &encrypted_data[5..5+header_len];
    let header: XdPasswordHeader = serde_json::from_slice(header_json)
        .map_err(|_| CryptoError::DecryptionError("Invalid password-based header".to_string()))?;

    let salt = base64::engine::general_purpose::STANDARD.decode(&header.salt)
        .map_err(|_| CryptoError::DecryptionError("Invalid salt format".to_string()))?;

    // Use the same KDF that was used for encryption
    let derived_key = if header.kdf == "argon2id" {
        derive_key_from_password_async(password, salt).await?
    } else {
        // Legacy PBKDF2 support would go here if needed
        return Err(CryptoError::DecryptionError("PBKDF2 decryption not supported in async mode".to_string()));
    };

    let secure_key = SecureKey::new(derived_key);

    let nonce = &encrypted_data[5+header_len..5+header_len+12];
    let ciphertext = &encrypted_data[5+header_len+12..];

    let cipher = Aes256Gcm::new_from_slice(secure_key.as_slice())
        .map_err(|_| CryptoError::DecryptionError("Failed to create cipher with derived key".to_string()))?;

    // Decrypt and verify authenticity in one operation
    let decrypted_data = cipher
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| CryptoError::AuthenticationError)?;

    Ok((decrypted_data, header.filename))
}
