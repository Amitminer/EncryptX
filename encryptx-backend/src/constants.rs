//! Application constants and configuration values
//!
//! This module centralizes all magic numbers, configuration values, and constants
//! used throughout the EncryptX backend. Organizing constants by module improves
//! maintainability and makes it easier to adjust security and performance parameters.
//!
//! # Module Organization
//! - `crypto`: Cryptographic parameters (key sizes, algorithm settings)
//! - `format`: File format constants (version numbers, markers, flags)
//! - `server`: Server configuration (limits, addresses, CORS)
//! - `compression`: Compression algorithm settings
/// Cryptographic constants and algorithm parameters.
///
/// These constants define the cryptographic parameters used throughout EncryptX.
/// Values are chosen to provide strong security while maintaining reasonable performance.
pub mod crypto {
    /// AES-256 key size in bytes (256 bits / 8 = 32 bytes)
    pub const AES_KEY_SIZE: usize = 32;
    
    /// AES-GCM nonce size in bytes (96 bits / 8 = 12 bytes, standard for GCM)
    pub const AES_NONCE_SIZE: usize = 12;
    
    /// Salt size for password-based key derivation (256 bits for strong entropy)
    pub const SALT_SIZE: usize = 32;
    
    /// Argon2id parameters optimized for security/performance balance.
    /// These values provide strong resistance against GPU-based attacks
    /// while maintaining reasonable performance on typical hardware.
    ///
    /// Memory cost: 64 MB (65536 KB) - balances security and memory usage
    pub const ARGON2_MEMORY_COST: u32 = 65536;
    
    /// Time cost: 3 iterations - provides good security with acceptable latency
    pub const ARGON2_TIME_COST: u32 = 3;
    
    /// Parallelism: 1 thread - keeps resource usage predictable
    pub const ARGON2_PARALLELISM: u32 = 1;
}

/// File format constants and version identifiers.
///
/// These constants define the binary file format used by EncryptX for encrypted files.
/// Version numbers allow for backward compatibility and format evolution.
pub mod format {
    /// Compression flag byte indicating zstd compression is applied.
    /// When present as the first byte of encrypted data, indicates decompression is needed.
    pub const COMPRESSION_FLAG: u8 = 0x01;
    
    /// Password-based encryption marker byte.
    /// Files starting with this byte use password-based encryption with Argon2id.
    pub const PASSWORD_MARKER: u8 = 0xFF;
    
    /// Current file format version for key-based encryption.
    /// Increment when making breaking changes to the key-based format.
    pub const KEY_FORMAT_VERSION: u8 = 2;
    
    /// Current file format version for password-based encryption.
    /// Increment when making breaking changes to the password-based format.
    pub const PASSWORD_FORMAT_VERSION: u8 = 3;
    
    /// Header length field size in bytes (32-bit big-endian integer).
    /// Allows parsing variable-length headers without knowing the size in advance.
    pub const HEADER_LENGTH_SIZE: usize = 4;
}

/// Server configuration constants and operational limits.
///
/// These constants define server behavior, resource limits, and default configuration.
/// Adjust these values based on your deployment requirements and available resources.
pub mod server {
    /// Maximum file size for uploads (1 GB).
    /// Prevents resource exhaustion from extremely large file uploads.
    /// Can be adjusted based on server capacity and use case requirements.
    pub const MAX_FILE_SIZE: usize = 1024 * 1024 * 1024;
    
    /// Default server bind address for development.
    /// Binds to all interfaces on port 8080 for maximum compatibility.
    pub const DEFAULT_BIND_ADDRESS: &str = "0.0.0.0:8080";
    
    /// Default CORS origin for development.
    /// Points to the typical Next.js development server address.
    pub const DEFAULT_CORS_ORIGIN: &str = "http://localhost:3000";
}

/// Compression algorithm constants and settings.
///
/// These constants control the compression behavior applied before encryption.
/// The compression level balances processing speed with compression efficiency.
pub mod compression {
    /// zstd compression level (balance between speed and compression ratio).
    /// Level 3 provides good compression with fast processing, suitable for real-time use.
    /// Range: 1 (fastest) to 22 (best compression). Higher levels use more CPU time.
    pub const ZSTD_COMPRESSION_LEVEL: i32 = 3;
}