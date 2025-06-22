# EncryptX Backend: File Encryption & Decryption API

## Overview
EncryptX provides REST API endpoints for secure file encryption using AES-256-GCM authenticated encryption. Supports both key-based and password-based encryption modes with integrity verification and memory-safe operations.

### Core Security Features
- AES-256-GCM authenticated encryption (prevents tampering)
- Argon2id password-based key derivation (GPU-resistant, 64 MB memory usage)
- Memory-safe key handling with automatic cleanup
- Cryptographically secure random nonce generation
- File format versioning for backward compatibility
- Built-in integrity verification

---

## File Formats

### Key-Based Encryption Format (.xd files)
```
[header length (4 bytes, big-endian)]
[header JSON (variable length)]
[nonce (12 bytes)]
[authenticated ciphertext (remaining bytes)]
```

### Password-Based Encryption Format (.xd files)
```
[format marker (1 byte, 0xFF)]
[header length (4 bytes, big-endian)]
[header JSON (variable length)]
[nonce (12 bytes)]
[authenticated ciphertext (remaining bytes)]
```

The 0xFF marker allows automatic detection of encryption mode during decryption.

---

## Header Formats

### Key-Based Header JSON
```json
{
  "filename": "document.pdf",
  "key": "base64-encoded-32-byte-key",
  "version": 2,
  "timestamp": 1735689600
}
```

### Password-Based Header JSON
```json
{
  "filename": "document.pdf",
  "salt": "base64-encoded-32-byte-salt",
  "kdf": "argon2id",
  "memory_cost": 65536,
  "time_cost": 3,
  "parallelism": 1,
  "version": 3,
  "timestamp": 1735689600
}
```

**Field Descriptions:**
- `filename`: Original file name for restoration after decryption
- `key`: Base64-encoded AES-256 key (only in key-based mode)
- `salt`: Base64-encoded random salt for Argon2 (only in password-based mode)
- `kdf`: Key derivation function identifier ("argon2id")
- `memory_cost`: Argon2 memory usage in KB (65536 = 64 MB)
- `time_cost`: Number of Argon2 iterations (3 for balanced security/performance)
- `parallelism`: Argon2 thread count (1 to avoid complexity)
- `version`: File format version for compatibility handling
- `timestamp`: Unix timestamp when file was encrypted

---

## Encryption Process

### Key-Based Encryption
1. Validate input: file data, filename, and 32-byte key
2. Store key in memory-safe container (auto-zeroes on drop)
3. Initialize AES-256-GCM cipher with the key
4. Generate cryptographically secure 12-byte nonce
5. Perform authenticated encryption (provides confidentiality + integrity)
6. Create JSON header with filename, key, version, and timestamp
7. Assemble final format: `[header_len][header][nonce][ciphertext]`
8. Automatically zero all key material from memory

### Password-Based Encryption (Async)
1. Receive file data, filename, and password
2. Generate cryptographically secure 32-byte salt
3. Derive AES key using Argon2id (64 MB memory, 3 iterations)
4. Follow same encryption process as key-based mode
5. Create header with salt and Argon2 parameters instead of key
6. Prepend 0xFF format marker for easy detection
7. Zero all derived keys and password material from memory

---

## Decryption Process

### Automatic Format Detection
The decryption process automatically detects the encryption mode:
- Files starting with 0xFF: Password-based encryption
- Files not starting with 0xFF: Key-based encryption

### Key-Based Decryption
1. Verify minimum file size and format structure
2. Extract and parse header length (big-endian 4 bytes)
3. Deserialize JSON header and validate format
4. Extract filename and encryption key from header
5. Initialize AES-256-GCM cipher with the key
6. Extract nonce (12 bytes) and ciphertext (remainder)
7. Perform authenticated decryption (fails if tampered)
8. Return original file data and filename
9. Automatically zero all cryptographic material

### Password-Based Decryption (Async)
1. Verify 0xFF format marker for password-based encryption
2. Parse password-specific header with Argon2 parameters
3. Validate Argon2 configuration (security requirements)
4. Extract and decode base64 salt
5. Re-derive AES key using provided password and stored salt
6. Follow same decryption process as key-based mode
7. Zero all derived keys and password material from memory

---

## API Usage Examples

### Key-Based Encryption

**Auto-generate key (key will be embedded in file):**
```bash
curl -X POST http://localhost:8080/encrypt \
  -H "x-orig-filename: document.docx" \
  --data-binary @document.docx \
  -o encrypted.xd
```

### Password-Based Encryption
```bash
curl -X POST http://localhost:8080/encrypt \
  -H "x-password: MySecurePassword123!" \
  -H "x-orig-filename: sensitive.xlsx" \
  --data-binary @sensitive.xlsx \
  -o encrypted.xd
```

### Decryption Examples

**Key-based decryption with explicit key:**
```bash
curl -X POST http://localhost:8080/decrypt \
  -H "x-enc-key: your-base64-key-here" \
  --data-binary @encrypted.xd \
  -o decrypted_file
```

**Password-based decryption:**
```bash
curl -X POST http://localhost:8080/decrypt \
  -H "x-password: MySecurePassword123!" \
  --data-binary @encrypted.xd \
  -o decrypted_file
```

**Using embedded key (no key header needed):**
```bash
curl -X POST http://localhost:8080/decrypt \
  --data-binary @encrypted.xd \
  -o decrypted_file
```

### Health Check
```bash
curl -X GET http://localhost:8080/health
```

---

## Security Implementation Details

### Cryptographic Guarantees
- **Confidentiality**: AES-256-GCM encryption protects data content
- **Integrity**: Built-in authentication tag detects any tampering
- **Authenticity**: Decryption fails if file has been modified
- **Forward Security**: Each encryption uses a unique random nonce

### Password Security
- **Argon2id**: Memory-hard algorithm resistant to GPU attacks
- **Salt**: 32-byte random salt prevents rainbow table attacks
- **Memory Cost**: 64 MB memory usage makes parallel attacks expensive
- **Time Cost**: 3 iterations balance security with performance

### Memory Safety
- **Automatic Zeroization**: Keys are cleared from memory after use
- **Secure Containers**: `SecureKey` type prevents accidental key exposure
- **No Key Logging**: Sensitive data is never logged or exposed in errors

---

## Error Handling

### HTTP Status Codes
- `200 OK`: Successful operation
- `400 Bad Request`: Invalid input format, wrong key size, format errors
- `401 Unauthorized`: Wrong password/key or corrupted file
- `500 Internal Server Error`: Encryption/decryption failures, async errors

### Common Error Messages
- "This is a password-encrypted file. A password is required for decryption."
- "This file was not encrypted with a password. Please decrypt without providing a password."
- "Invalid file format. The file may be corrupt or not a valid .xd file."
- "Key must be exactly 32 bytes"
- "Wrong password or file is corrupt"

---

## Technical Implementation

### Core Dependencies
- `aes-gcm`: AES-256-GCM authenticated encryption implementation
- `argon2`: Argon2id password-based key derivation
- `zeroize`: Secure memory clearing for sensitive data
- `rand`: Cryptographically secure random number generation
- `actix-web`: Async HTTP server framework

### Configuration
```rust
// Argon2 parameters for security/performance balance
const ARGON2_MEMORY_COST: u32 = 65536; // 64 MB
const ARGON2_TIME_COST: u32 = 3;       // 3 iterations  
const ARGON2_PARALLELISM: u32 = 1;     // Single thread
const SALT_LENGTH: usize = 32;         // 256-bit salt
```

### Format Detection Logic
```rust
// Automatic mode detection during decryption
if encrypted_data[0] == 0xFF {
    // Password-based format
    decrypt_with_password_async(data, password).await
} else {
    // Key-based format
    decrypt_with_header(data, key)
}
```