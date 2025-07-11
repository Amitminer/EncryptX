use encryptx_backend::api;
use std::fs;
use tempfile::tempdir;

#[tokio::test]
async fn encrypt_and_decrypt_example_txt() {
    // Setup temp directory and file
    let dir = tempdir().unwrap();
    let file_path = dir.path().join("example.txt");
    let content = b"EncryptX integration test file!";
    fs::write(&file_path, content).unwrap();

    // Encrypt using the public API
    let password = "testpassword";
    let encrypted = api::encrypt_file_bytes(content, Some(password), None, "example.txt")
        .await
        .unwrap();
    let encrypted_path = dir.path().join("example.xd");
    fs::write(&encrypted_path, &encrypted).unwrap();

    // Decrypt using the public API
    let encrypted_bytes = fs::read(&encrypted_path).unwrap();
    let (decrypted, filename) = api::decrypt_file_bytes(&encrypted_bytes, Some(password), None)
        .await
        .unwrap();
    assert_eq!(decrypted, content);
    assert_eq!(filename, "example.txt");
}
