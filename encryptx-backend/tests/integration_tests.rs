/// Comprehensive integration tests for EncryptX backend
/// Tests all major functionality including edge cases and error conditions
use encryptx_backend::{api, constants::crypto::*};

#[tokio::test]
async fn test_full_encryption_decryption_cycle_password() {
    let test_data = b"Hello, World! This is a comprehensive test of the encryption system.";
    let password = "test_password_123";
    let filename = "test_file.txt";

    // Test password-based encryption
    let encrypted = api::encrypt_file_bytes(test_data, Some(password), None, filename)
        .await
        .expect("Encryption should succeed");

    // Test password-based decryption
    let (decrypted, recovered_filename) = api::decrypt_file_bytes(&encrypted, Some(password), None)
        .await
        .expect("Decryption should succeed");

    assert_eq!(decrypted, test_data);
    assert_eq!(recovered_filename, filename);
}

#[tokio::test]
async fn test_full_encryption_decryption_cycle_key() {
    let test_data = b"Key-based encryption test data with special characters: !@#$%^&*()";
    let key = [42u8; AES_KEY_SIZE]; // Test key
    let filename = "key_test.bin";

    // Test key-based encryption
    let encrypted = api::encrypt_file_bytes(test_data, None, Some(&key), filename)
        .await
        .expect("Encryption should succeed");

    // Test key-based decryption
    let (decrypted, recovered_filename) = api::decrypt_file_bytes(&encrypted, None, Some(&key))
        .await
        .expect("Decryption should succeed");

    assert_eq!(decrypted, test_data);
    assert_eq!(recovered_filename, filename);
}

#[tokio::test]
async fn test_large_file_encryption() {
    // Test with a 1MB file
    let large_data = vec![0xABu8; 1024 * 1024];
    let password = "large_file_password";
    let filename = "large_file.dat";

    let encrypted = api::encrypt_file_bytes(&large_data, Some(password), None, filename)
        .await
        .expect("Large file encryption should succeed");

    let (decrypted, _) = api::decrypt_file_bytes(&encrypted, Some(password), None)
        .await
        .expect("Large file decryption should succeed");

    assert_eq!(decrypted, large_data);
}

#[tokio::test]
async fn test_empty_file_handling() {
    let empty_data = b"";
    let password = "empty_file_password";
    let filename = "empty.txt";

    // Empty files are allowed in the API layer (validation happens at service layer)
    let result = api::encrypt_file_bytes(empty_data, Some(password), None, filename).await;
    assert!(result.is_ok(), "Empty files should be allowed in API layer");
    
    // Test that we can decrypt it back
    if let Ok(encrypted) = result {
        let (decrypted, recovered_filename) = api::decrypt_file_bytes(&encrypted, Some(password), None)
            .await
            .expect("Decryption should succeed");
        assert_eq!(decrypted, empty_data);
        assert_eq!(recovered_filename, filename);
    }
}

#[tokio::test]
async fn test_wrong_password_decryption() {
    let test_data = b"Secret data that should not be decryptable with wrong password";
    let correct_password = "correct_password";
    let wrong_password = "wrong_password";
    let filename = "secret.txt";

    // Encrypt with correct password
    let encrypted = api::encrypt_file_bytes(test_data, Some(correct_password), None, filename)
        .await
        .expect("Encryption should succeed");

    // Try to decrypt with wrong password
    let result = api::decrypt_file_bytes(&encrypted, Some(wrong_password), None).await;
    assert!(
        result.is_err(),
        "Decryption with wrong password should fail"
    );
}

#[tokio::test]
async fn test_wrong_key_decryption() {
    let test_data = b"Secret data encrypted with key";
    let correct_key = [1u8; AES_KEY_SIZE];
    let wrong_key = [2u8; AES_KEY_SIZE];
    let filename = "key_secret.txt";

    // Encrypt with correct key
    let encrypted = api::encrypt_file_bytes(test_data, None, Some(&correct_key), filename)
        .await
        .expect("Encryption should succeed");

    // Try to decrypt with wrong key
    let result = api::decrypt_file_bytes(&encrypted, None, Some(&wrong_key)).await;
    assert!(result.is_err(), "Decryption with wrong key should fail");
}

#[tokio::test]
async fn test_mixed_encryption_decryption_methods() {
    let test_data = b"Data encrypted with password";
    let password = "test_password";
    let key = [42u8; AES_KEY_SIZE];
    let filename = "mixed_test.txt";

    // Encrypt with password
    let encrypted = api::encrypt_file_bytes(test_data, Some(password), None, filename)
        .await
        .expect("Password encryption should succeed");

    // Try to decrypt with key (should fail)
    let result = api::decrypt_file_bytes(&encrypted, None, Some(&key)).await;
    assert!(
        result.is_err(),
        "Decrypting password-encrypted file with key should fail"
    );
}

#[tokio::test]
async fn test_corrupted_file_decryption() {
    let test_data = b"Data that will be corrupted";
    let password = "corruption_test";
    let filename = "corrupt_test.txt";

    // Encrypt normally
    let mut encrypted = api::encrypt_file_bytes(test_data, Some(password), None, filename)
        .await
        .expect("Encryption should succeed");

    // Corrupt the encrypted data
    if encrypted.len() > 10 {
        let len = encrypted.len();
        encrypted[len - 5] ^= 0xFF; // Flip some bits
    }

    // Try to decrypt corrupted data
    let result = api::decrypt_file_bytes(&encrypted, Some(password), None).await;
    assert!(result.is_err(), "Decrypting corrupted data should fail");
}

// Compression service tests are in the main crate

// Validation function tests are in the main crate unit tests

#[tokio::test]
async fn test_binary_file_encryption() {
    // Test with binary data (not just text)
    let binary_data: Vec<u8> = (0..=255).cycle().take(1000).collect();
    let password = "binary_test_password";
    let filename = "binary_file.bin";

    let encrypted = api::encrypt_file_bytes(&binary_data, Some(password), None, filename)
        .await
        .expect("Binary file encryption should succeed");

    let (decrypted, recovered_filename) = api::decrypt_file_bytes(&encrypted, Some(password), None)
        .await
        .expect("Binary file decryption should succeed");

    assert_eq!(decrypted, binary_data);
    assert_eq!(recovered_filename, filename);
}

#[tokio::test]
async fn test_unicode_filename_handling() {
    let test_data = b"Unicode filename test";
    let password = "unicode_test";
    let unicode_filename = "测试文件.txt"; // Chinese characters

    let encrypted = api::encrypt_file_bytes(test_data, Some(password), None, unicode_filename)
        .await
        .expect("Encryption with unicode filename should succeed");

    let (decrypted, recovered_filename) = api::decrypt_file_bytes(&encrypted, Some(password), None)
        .await
        .expect("Decryption should succeed");

    assert_eq!(decrypted, test_data);
    // Note: Unicode filename might be sanitized during validation
    assert!(!recovered_filename.is_empty());
}

#[tokio::test]
async fn test_compression_effectiveness() {
    // Test with highly compressible data
    let repetitive_data = b"AAAAAAAAAA".repeat(1000);
    let password = "compression_test";
    let filename = "repetitive.txt";

    let encrypted = api::encrypt_file_bytes(&repetitive_data, Some(password), None, filename)
        .await
        .expect("Encryption should succeed");

    // Encrypted file should be significantly smaller than original due to compression
    assert!(
        encrypted.len() < repetitive_data.len() / 2,
        "Compressed encrypted file should be much smaller"
    );

    let (decrypted, _) = api::decrypt_file_bytes(&encrypted, Some(password), None)
        .await
        .expect("Decryption should succeed");

    assert_eq!(decrypted, repetitive_data);
}

// Service error conversion tests are in the main crate unit tests
