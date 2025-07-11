pub mod cli;
pub mod crypto;

pub mod api {
    use crate::crypto;
    use rand::RngCore;
    use zstd::stream::{decode_all, encode_all};

    /// Encrypts file bytes with password or key, compressing before encryption.
    /// - If password is Some, uses password-based encryption (Argon2id).
    /// - If key is Some, uses key-based encryption (AES-256-GCM, 32 bytes).
    /// - If both are None, generates a random key and returns it in the error.
    pub async fn encrypt_file_bytes(
        input: &[u8],
        password: Option<&str>,
        key: Option<&[u8]>,
        filename: &str,
    ) -> Result<Vec<u8>, String> {
        // Compress input
        let compressed = encode_all(input, 3).map_err(|e| format!("Compression error: {e}"))?;
        let mut compressed_with_flag = Vec::with_capacity(1 + compressed.len());
        compressed_with_flag.push(0x01);
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

    /// Decrypts file bytes with password or key, decompressing after decryption.
    /// - If password is Some, uses password-based decryption.
    /// - If key is Some, uses key-based decryption.
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
        if decrypted.first() == Some(&0x01) {
            let decompressed =
                decode_all(&decrypted[1..]).map_err(|e| format!("Decompression error: {e}"))?;
            Ok((decompressed, filename))
        } else {
            Ok((decrypted, filename))
        }
    }
}
