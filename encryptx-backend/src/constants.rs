/// Application constants and configuration values
/// Centralizes all magic numbers and configuration for better maintainability
/// Cryptographic constants
pub mod crypto {
    /// AES-256 key size in bytes
    pub const AES_KEY_SIZE: usize = 32;
    
    /// AES-GCM nonce size in bytes
    pub const AES_NONCE_SIZE: usize = 12;
    
    /// Salt size for password-based key derivation
    pub const SALT_SIZE: usize = 32;
    
    /// Argon2 parameters for security/performance balance
    pub const ARGON2_MEMORY_COST: u32 = 65536; // 64 MB
    pub const ARGON2_TIME_COST: u32 = 3;       // 3 iterations
    pub const ARGON2_PARALLELISM: u32 = 1;     // Single thread
}

/// File format constants
pub mod format {
    /// Compression flag byte (indicates zstd compression)
    pub const COMPRESSION_FLAG: u8 = 0x01;
    
    /// Password-based encryption marker byte
    pub const PASSWORD_MARKER: u8 = 0xFF;
    
    /// Current file format version for key-based encryption
    pub const KEY_FORMAT_VERSION: u8 = 2;
    
    /// Current file format version for password-based encryption
    pub const PASSWORD_FORMAT_VERSION: u8 = 3;
    
    /// Header length field size in bytes
    pub const HEADER_LENGTH_SIZE: usize = 4;
}

/// Server configuration constants
pub mod server {
    /// Maximum file size for uploads (1 GB)
    pub const MAX_FILE_SIZE: usize = 1024 * 1024 * 1024;
    
    /// Default server bind address
    pub const DEFAULT_BIND_ADDRESS: &str = "0.0.0.0:8080";
    
    /// Default CORS origin
    pub const DEFAULT_CORS_ORIGIN: &str = "http://localhost:3000";
}

/// Compression constants
pub mod compression {
    /// zstd compression level (balance between speed and compression ratio)
    pub const ZSTD_COMPRESSION_LEVEL: i32 = 3;
}