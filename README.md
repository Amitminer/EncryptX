# 🔐 EncryptX: Secure File Encryption

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v3/monitor/1zv32.svg)](https://uptime.betterstack.com/?utm_source=status_badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**EncryptX** is a modern, secure, full-stack file encryption tool. It provides a seamless experience for encrypting and decrypting any file type — powered by a blazing-fast Rust backend and a polished Next.js frontend.

Built for developers and privacy-conscious users alike, EncryptX supports both password and key-based encryption with cryptographic standards like **AES-256-GCM** and **Argon2id**.

---

## ✨ Features

- 🔑 **Dual Encryption Methods**: Use a password or 256-bit encryption key.
- 🔐 **End-to-End Security**: AES-256-GCM ensures confidentiality and integrity.
- 🧠 **Argon2id Password Hashing**: Secure key derivation for passwords.
- 🧪 **Tamper Detection**: Authenticated encryption blocks modification.
- 📂 **Any File Type**: Works for docs, media, videos, archives — anything.
- 📦 **Automatic Compression**: Files are compressed with zstd before encryption for efficient storage and transfer.
- 🧱 **Large File Support**: Optimized for files up to 1GB.
- 🖥️ **Modern UI**: Built with Next.js + Tailwind, featuring drag & drop and smooth feedback.
- 🧼 **Memory-Safe Backend**: Rust ensures sensitive data is securely handled.

---

## 🚀 Getting Started

You can run EncryptX locally or via Docker.

---

### 🛠️ Local Development Setup

#### 🔧 Prerequisites

- [Rust (latest stable)](https://www.rust-lang.org/tools/install)
- [Node.js v20+](https://nodejs.org/)

#### ⚙️ Backend (Rust + Actix)

```bash
cd encryptx-backend
cargo build --release
cargo run --release
````

Runs on: `http://127.0.0.1:8080`

#### 🖥️ Frontend (Next.js + Tailwind)

```bash
cd encryptx-frontend
npm install
npm run dev
```

Runs on: `http://localhost:3000`

---

## 🐳 Docker Support

You can also run EncryptX via Docker using `docker-compose.yml`.

### 🔧 Prerequisites

* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose v2+](https://docs.docker.com/compose/install/)

### ▶️ Run Everything with Docker

```bash
git clone https://github.com/yourusername/encryptx.git
cd encryptx
docker compose up --build
```

By default:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend: [http://localhost:8080](http://localhost:8080)

### ⚙️ Environment Configuration

Create a `.env` file:

```env
ALLOWED_ORIGIN=http://localhost:3000
BETTER_API_KEY=your_betterstack_api_key
BETTER_MONITOR_ID=your_monitor_id
```

---

## 📡 API Reference

### 🔐 POST `/encrypt`

Encrypts a file (streamed in the request body).

**Note:** All files are automatically compressed with zstd before encryption. This improves storage efficiency and transfer speed. Decryption will automatically decompress the file to its original form.

**Headers:**

* **Password-based**:

  * `x-password`: your password
* **Key-based**:

  * `x-enc-key`: 32-byte base64 key
* Optional: `x-orig-filename`

---

### 🔓 POST `/decrypt`

Decrypts a `.xd` encrypted file.

**Note:** Decrypted files are automatically decompressed if they were compressed during encryption.

**Headers:**

* `x-password` **or** `x-enc-key` — whichever was used during encryption.

---

## 🦀 Public Rust API (for Developers)

You can use EncryptX as a library in your own Rust projects!

### Example: Encrypt & Decrypt Any File

```rust
use encryptx_backend::api;

#[tokio::main]
async fn main() {
    let file_bytes = std::fs::read("example.txt").unwrap();
    let password = "mysecret";
    // Encrypt
    let encrypted = api::encrypt_file_bytes(&file_bytes, Some(password), None, "example.txt").await.unwrap();
    // Decrypt
    let (decrypted, filename) = api::decrypt_file_bytes(&encrypted, Some(password), None).await.unwrap();
    assert_eq!(decrypted, file_bytes);
    println!("Decrypted filename: {}", filename);
}
```

- Supports both password and key-based encryption (just pass `Some(key)` instead of password).
- Handles compression automatically.
- Returns the original filename on decrypt.

**This is the recommended way to integrate EncryptX into your own Rust apps, services, or tests!**

---

## 🧱 Tech Stack

| Layer      | Tech                                 |
| ---------- | ------------------------------------ |
| Backend    | Rust, Actix Web, Serde, Zeroize      |
| Compression | zstd (automatic, lossless)              |
| Frontend   | Next.js, React, TypeScript, Tailwind |
| Crypto     | AES-256-GCM, Argon2id, SHA-256       |
| Infra      | Railway (Backend), Vercel (Frontend) |
| Monitoring | BetterUptime                         |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
© 2025 [AmitxD](https://github.com/Amitminer)