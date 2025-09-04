//! Input validation utilities for EncryptX backend
//!
//! This module provides comprehensive validation for API requests and file operations,
//! including rate limiting, file size validation, cryptographic parameter validation,
//! and security-focused input sanitization.
//!
//! # Security Features
//! - Rate limiting per IP address with configurable windows
//! - File size limits to prevent resource exhaustion
//! - Cryptographic key format validation
//! - Filename sanitization to prevent directory traversal
//! - Password strength recommendations (non-enforced)
//! - Client IP extraction with proxy header support
use crate::constants::{crypto::*, server::*};
use actix_web::{HttpRequest, HttpResponse, Result as ActixResult};
use base64::{Engine, engine::general_purpose};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Rate limiting implementation using a sliding window approach.
///
/// Tracks request timestamps per IP address and automatically cleans up old entries.
/// Uses a HashMap to store request times, making it suitable for moderate traffic loads.
/// For high-traffic production use, consider Redis-based rate limiting.
#[derive(Debug)]
pub struct RateLimiter {
    requests: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    /// Creates a new rate limiter with specified limits.
    ///
    /// # Parameters
    /// - `max_requests`: Maximum number of requests allowed per IP in the time window
    /// - `window_seconds`: Time window duration in seconds
    ///
    /// # Example
    /// ```
    /// let limiter = RateLimiter::new(10, 60); // 10 requests per minute
    /// ```
    pub fn new(max_requests: usize, window_seconds: u64) -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window: Duration::from_secs(window_seconds),
        }
    }

    /// Checks if a request from the given IP should be allowed.
    ///
    /// Implements a sliding window rate limiting algorithm. Automatically cleans up
    /// expired entries to prevent memory leaks. Returns true if the request should
    /// be allowed, false if the rate limit is exceeded.
    ///
    /// # Parameters
    /// - `ip`: The client IP address as a string
    ///
    /// # Returns
    /// `true` if the request is within rate limits, `false` if it should be rejected
    pub fn check_rate_limit(&self, ip: &str) -> bool {
        let mut requests = self.requests.lock().unwrap();
        let now = Instant::now();
        
        // Clean up old entries
        requests.retain(|_, times| {
            times.retain(|&time| now.duration_since(time) < self.window);
            !times.is_empty()
        });

        // Check current IP
        let ip_requests = requests.entry(ip.to_string()).or_default();
        
        if ip_requests.len() >= self.max_requests {
            false
        } else {
            ip_requests.push(now);
            true
        }
    }
}

/// Validates file size against configured limits to prevent resource exhaustion.
///
/// Ensures uploaded files are within acceptable size bounds. Rejects empty files
/// and files exceeding the maximum size limit defined in server constants.
///
/// # Parameters
/// - `size`: The file size in bytes
///
/// # Returns
/// `Ok(())` if the file size is valid, or an Actix error for invalid sizes
///
/// # Errors
/// - `ErrorBadRequest` for empty files (0 bytes)
/// - `ErrorPayloadTooLarge` for files exceeding the maximum size limit
pub fn validate_file_size(size: usize) -> ActixResult<()> {
    if size == 0 {
        return Err(actix_web::error::ErrorBadRequest("Empty files are not allowed"));
    }
    
    if size > MAX_FILE_SIZE {
        return Err(actix_web::error::ErrorPayloadTooLarge(
            format!("File size {} bytes exceeds maximum allowed size of {} bytes", 
                   size, MAX_FILE_SIZE)
        ));
    }
    
    Ok(())
}

/// Validates encryption key format and size for AES-256 compatibility.
///
/// Decodes a base64-encoded encryption key and validates it meets AES-256 requirements.
/// Provides user-friendly error messages for common key format issues.
///
/// # Parameters
/// - `key_b64`: Base64-encoded encryption key string
///
/// # Returns
/// The decoded 32-byte key as `Vec<u8>` on success, or a descriptive error message
///
/// # Errors
/// - Invalid base64 encoding
/// - Wrong key size (must be exactly 32 bytes for AES-256)
/// - Empty key string
pub fn validate_encryption_key(key_b64: &str) -> Result<Vec<u8>, String> {
    if key_b64.is_empty() {
        return Err("Encryption key cannot be empty".to_string());
    }

    let key = general_purpose::STANDARD
        .decode(key_b64)
        .map_err(|_| "Invalid encryption key format. Please check your Base64 key or use the human-readable format.".to_string())?;

    if key.len() != AES_KEY_SIZE {
        return Err(format!(
            "Invalid encryption key size. Expected {} bytes, got {} bytes. Please verify your key is correct.",
            AES_KEY_SIZE, key.len()
        ));
    }

    Ok(key)
}

/// Validates password strength with basic security checks.
///
/// Performs fundamental password validation including length requirements and
/// character variety recommendations. Does not enforce strict complexity rules
/// to maintain usability, but provides warnings for weak passwords.
///
/// # Parameters
/// - `password`: The password string to validate
///
/// # Returns
/// `Ok(())` if the password meets basic requirements, or an error message
///
/// # Security Notes
/// - Minimum 8 characters required
/// - Maximum 1024 characters to prevent DoS
/// - Warns about lack of character variety but doesn't reject
pub fn validate_password(password: &str) -> Result<(), String> {
    if password.is_empty() {
        return Err("Password cannot be empty".to_string());
    }

    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }

    if password.len() > 1024 {
        return Err("Password is too long (maximum 1024 characters)".to_string());
    }

    // Check for basic character variety (optional but recommended)
    let has_letter = password.chars().any(|c| c.is_alphabetic());
    let has_digit = password.chars().any(|c| c.is_numeric());
    
    if !has_letter || !has_digit {
        // This is a warning, not an error - we don't enforce strong passwords
        // but we could log this for security monitoring
        eprintln!("Warning: Password should contain both letters and numbers for better security");
    }

    Ok(())
}

/// Validates filename for security
pub fn validate_filename(filename: &str) -> Result<String, String> {
    if filename.is_empty() {
        return Ok("file.bin".to_string());
    }

    if filename.len() > 255 {
        return Err("Filename is too long (maximum 255 characters)".to_string());
    }

    // Check for dangerous characters
    let dangerous_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '\0'];
    if filename.chars().any(|c| dangerous_chars.contains(&c)) {
        return Err("Filename contains invalid characters".to_string());
    }

    // Prevent directory traversal
    if filename.contains("..") {
        return Err("Filename cannot contain '..' sequences".to_string());
    }

    // Sanitize the filename
    let sanitized = filename
        .chars()
        .filter(|c| c.is_ascii() && !c.is_control())
        .collect::<String>();

    if sanitized.is_empty() {
        Ok("file.bin".to_string())
    } else {
        Ok(sanitized)
    }
}

/// Extracts and validates client IP address
pub fn get_client_ip(req: &HttpRequest) -> String {
    // Check for forwarded headers first (for reverse proxies)
    if let Some(forwarded) = req.headers().get("x-forwarded-for")
        && let Ok(forwarded_str) = forwarded.to_str()
        && let Some(first_ip) = forwarded_str.split(',').next() {
            return first_ip.trim().to_string();
        }

    if let Some(real_ip) = req.headers().get("x-real-ip")
        && let Ok(ip_str) = real_ip.to_str() {
            return ip_str.to_string();
        }

    // Fall back to connection info
    req.connection_info()
        .peer_addr()
        .unwrap_or("unknown")
        .to_string()
}

/// Result type for crypto header validation
type CryptoHeadersResult = Result<(Option<String>, Option<Vec<u8>>, String), HttpResponse>;

/// Validates request headers for encryption/decryption
pub fn validate_crypto_headers(req: &HttpRequest) -> CryptoHeadersResult {
    let password = req.headers()
        .get("x-password")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let key = if let Some(key_header) = req.headers().get("x-enc-key") {
        let key_b64 = key_header.to_str()
            .map_err(|_| HttpResponse::BadRequest().body("Invalid key header encoding"))?;
        
        if !key_b64.is_empty() {
            Some(validate_encryption_key(key_b64)
                .map_err(|e| HttpResponse::BadRequest().body(e))?)
        } else {
            None
        }
    } else {
        None
    };

    // Validate that only one method is provided
    match (&password, &key) {
        (Some(_), Some(_)) => {
            return Err(HttpResponse::BadRequest()
                .body("Cannot specify both password and key. Choose one encryption method."));
        }
        (None, None) => {
            // This is allowed for key-based encryption with auto-generated keys
        }
        _ => {} // One method provided, which is fine
    }

    // Validate password if provided
    if let Some(ref pwd) = password {
        validate_password(pwd)
            .map_err(|e| HttpResponse::BadRequest().body(e))?;
    }

    // Get and validate filename
    let filename = req.headers()
        .get("x-orig-filename")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("file.bin");

    let validated_filename = validate_filename(filename)
        .map_err(|e| HttpResponse::BadRequest().body(e))?;

    Ok((password, key, validated_filename))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_file_size() {
        assert!(validate_file_size(0).is_err());
        assert!(validate_file_size(1024).is_ok());
        assert!(validate_file_size(MAX_FILE_SIZE).is_ok());
        assert!(validate_file_size(MAX_FILE_SIZE + 1).is_err());
    }

    #[test]
    fn test_validate_encryption_key() {
        // Valid 32-byte key in base64
        let valid_key = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="; // 32 bytes
        assert!(validate_encryption_key(valid_key).is_ok());

        // Invalid base64
        assert!(validate_encryption_key("invalid!@#").is_err());

        // Wrong size
        let short_key = "YWJjZA=="; // 4 bytes
        assert!(validate_encryption_key(short_key).is_err());
    }

    #[test]
    fn test_validate_password() {
        assert!(validate_password("").is_err());
        assert!(validate_password("short").is_err());
        assert!(validate_password("validpassword123").is_ok());
        assert!(validate_password(&"x".repeat(1025)).is_err());
    }

    #[test]
    fn test_validate_filename() {
        assert_eq!(validate_filename("").unwrap(), "file.bin");
        assert_eq!(validate_filename("test.txt").unwrap(), "test.txt");
        assert!(validate_filename("../etc/passwd").is_err());
        assert!(validate_filename("file/with/slash").is_err());
        assert!(validate_filename(&"x".repeat(256)).is_err());
    }

    #[test]
    fn test_rate_limiter() {
        let limiter = RateLimiter::new(2, 60);
        
        assert!(limiter.check_rate_limit("127.0.0.1"));
        assert!(limiter.check_rate_limit("127.0.0.1"));
        assert!(!limiter.check_rate_limit("127.0.0.1")); // Third request should be blocked
        
        // Different IP should be allowed
        assert!(limiter.check_rate_limit("192.168.1.1"));
    }
}