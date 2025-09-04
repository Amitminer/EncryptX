# 🦀 EncryptX Backend

**High-performance Rust backend providing secure file encryption services via REST API and CLI.**

Built with Actix Web, featuring AES-256-GCM encryption, Argon2id key derivation, and comprehensive security hardening.

---

## ✨ Features

- 🔐 **AES-256-GCM Encryption**: Authenticated encryption with integrity protection
- 🧠 **Argon2id Key Derivation**: GPU-resistant password hashing (64MB memory cost)
- 🚀 **High Performance**: Async Rust with Actix Web framework
- 🛡️ **Security Hardened**: Rate limiting, input validation, security headers
- 📦 **Automatic Compression**: zstd compression before encryption
- 🔧 **Dual Interface**: REST API and command-line tool
- 🧼 **Memory Safe**: Automatic key zeroization and secure memory handling
- 📊 **Comprehensive Logging**: Structured logging with configurable levels

---

## 🚀 Quick Start

### Prerequisites

- **Rust** 1.70+ with Cargo
- **OpenSSL** development libraries (for cryptographic operations)

### Installation

```bash
# Clone and navigate to backend
git clone https://github.com/Amitminer/EncryptX.git
cd EncryptX/encryptx-backend

# Install dependencies and build
cargo build --release

# Run the server
cargo run
```

### Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
ALLOWED_ORIGIN=http://localhost:3000
RUST_LOG=info
```

---

## 🔧 API Reference

### Base URL
```
http://localhost:8080
```

### Endpoints

#### `POST /encrypt`
Encrypt a file with password or key-based encryption.

**Headers:**
- `Content-Type: application/octet-stream`
- `x-orig-filename: string` (optional) - Original filename
- `x-password: string` (optional) - Password for encryption
- `x-enc-key: string` (optional) - Base64-encoded 256-bit key

**Body:** Raw file bytes

**Response:** Encrypted `.xd` file as binary stream

**Example:**
```bash
curl -X POST http://localhost:8080/encrypt \
  -H "Content-Type: application/octet-stream" \
  -H "x-password: mysecretpassword" \
  -H "x-orig-filename: document.pdf" \
  --data-binary @document.pdf \
  -o document.xd
```

#### `POST /decrypt`
Decrypt an `.xd` file.

**Headers:**
- `Content-Type: application/octet-stream`
- `x-password: string` (optional) - Password for decryption
- `x-enc-key: string` (optional) - Base64-encoded 256-bit key

**Body:** Encrypted `.xd` file bytes

**Response:** Original file as binary stream with `Content-Disposition` header

**Example:**
```bash
curl -X POST http://localhost:8080/decrypt \
  -H "Content-Type: application/octet-stream" \
  -H "x-password: mysecretpassword" \
  --data-binary @document.xd \
  -o decrypted_document.pdf
```

#### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  \"status\": \"healthy\",
  \"timestamp\": \"2025-01-31T12:00:00Z\"
}
```



---

## 🖥️ Command Line Interface

### Encryption

```bash
# Encrypt with password
cargo run encrypt --file secret.txt --password mysecretpassword

# Encrypt with custom key
cargo run encrypt --file document.pdf --key YOUR_BASE64_KEY

# Encrypt with auto-generated key (key will be printed - save it!)
cargo run encrypt --file data.zip

# Specify output file
cargo run encrypt --file input.txt --password secret --output encrypted.xd

# Force overwrite existing files
cargo run encrypt --file input.txt --password secret --force
```

### Decryption

```bash
# Decrypt with password
cargo run decrypt --file secret.xd --password mysecretpassword

# Decrypt with key
cargo run decrypt --file document.xd --key YOUR_BASE64_KEY

# Specify output file
cargo run decrypt --file encrypted.xd --password secret --output decrypted.txt

# Force overwrite existing files
cargo run decrypt --file encrypted.xd --password secret --force
```

---

## 🏗️ Architecture

### Project Structure

```
encryptx-backend/
├── src/
│   ├── crypto/              # Core cryptographic operations
│   │   └── mod.rs          # AES-GCM, Argon2id implementations
│   ├── service/            # Business logic layer
│   │   └── mod.rs          # Service abstractions
│   ├── validation/         # Input validation and security
│   │   └── mod.rs          # Request validation, rate limiting
│   ├── middleware/         # HTTP middleware
│   │   └── mod.rs          # Security headers, CORS
│   ├── cli/               # Command-line interface
│   │   └── mod.rs          # CLI argument parsing and execution
│   ├── constants/         # Configuration constants
│   │   └── mod.rs          # Centralized configuration values
│   ├── main.rs            # Web server entry point
│   └── lib.rs             # Public library API
├── tests/                 # Integration tests
│   ├── integration_tests.rs
│   ├── api.hurl          # HTTP API tests
│   └── cli.rs            # CLI tests
├── Cargo.toml            # Dependencies and metadata
├── Dockerfile            # Container configuration
└── README.md             # This file
```

### Key Components

#### Crypto Module (`src/crypto/mod.rs`)
- **AES-256-GCM**: Authenticated encryption with 96-bit nonces
- **Argon2id**: Memory-hard key derivation (64MB, 3 iterations)
- **Secure Key Management**: Automatic zeroization, secure random generation
- **File Format**: Custom `.xd` format with JSON headers

#### Service Layer (`src/service/mod.rs`)
- **FileEncryptionService**: High-level encryption/decryption operations
- **CompressionService**: zstd compression with configurable levels
- **Error Handling**: Structured error types with HTTP status mapping

#### Validation (`src/validation/mod.rs`)
- **Input Sanitization**: File size, filename, password validation
- **Rate Limiting**: IP-based request throttling (10 req/min)
- **Security Checks**: Key format validation, CORS origin verification

#### Middleware (`src/middleware/mod.rs`)
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **CORS Configuration**: Configurable cross-origin policies
- **Request Logging**: Structured logging with request tracing

---

## 🔒 Security Features

### Cryptographic Security
- **AES-256-GCM**: NIST-approved authenticated encryption
- **Argon2id**: Winner of password hashing competition
- **Secure Random**: OS-provided cryptographically secure RNG
- **Key Zeroization**: Automatic memory cleanup for sensitive data

### Application Security
- **Rate Limiting**: 10 requests per minute per IP address
- **Input Validation**: Comprehensive validation of all inputs
- **Security Headers**: Full suite of HTTP security headers
- **CORS Protection**: Configurable cross-origin policies
- **File Size Limits**: Maximum 1GB file size to prevent DoS

### Memory Safety
- **Rust Language**: Memory safety without garbage collection
- **Secure Containers**: `SecureKey` type with automatic zeroization
- **No Key Storage**: Keys never persisted to disk or logs

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ALLOWED_ORIGIN` | CORS allowed origins (comma-separated) | `http://localhost:3000` | No |
| `RUST_LOG` | Logging level (`error`, `warn`, `info`, `debug`, `trace`) | `info` | No |
| `BIND_ADDRESS` | Server bind address | `0.0.0.0:8080` | No |

### Compile-time Configuration

Edit `src/constants/mod.rs` to modify:

```rust
// Cryptographic parameters
pub const ARGON2_MEMORY_COST: u32 = 65536; // 64 MB
pub const ARGON2_TIME_COST: u32 = 3;       // 3 iterations
pub const AES_KEY_SIZE: usize = 32;         // 256 bits

// Server limits
pub const MAX_FILE_SIZE: usize = 1024 * 1024 * 1024; // 1 GB
pub const RATE_LIMIT_REQUESTS: usize = 10;            // per minute

// Compression
pub const ZSTD_COMPRESSION_LEVEL: i32 = 3; // Balance speed/ratio
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test module
cargo test crypto::tests
```

### Integration Tests
```bash
# Run integration tests
cargo test --test integration_tests

# Run API tests with hurl
hurl --test tests/api.hurl
```

### Linting and Formatting
```bash
# Check code formatting
cargo fmt --check

# Run clippy linter
cargo clippy --all-targets --all-features -- -D warnings

# Fix formatting
cargo fmt
```

### Performance Testing
```bash
# Build optimized binary
cargo build --release

# Benchmark encryption performance
cargo run --release encrypt --file large_file.bin --password test
```

---

## 📊 Performance

### Benchmarks (on modern hardware)

| Operation | Throughput | Memory Usage |
|-----------|------------|--------------|
| AES-256-GCM Encryption | ~500 MB/s | <10 MB |
| Argon2id Key Derivation | ~1 key/s | 64 MB |
| zstd Compression | ~300 MB/s | <50 MB |
| File I/O | Limited by disk speed | Minimal |

### Optimization Tips

1. **Large Files**: Use streaming for files >100MB
2. **Concurrent Requests**: Actix Web handles thousands of connections
3. **Memory Usage**: Argon2id uses 64MB per operation
4. **CPU Usage**: Encryption is CPU-intensive, consider multiple cores

---

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Update Rust toolchain
rustup update

# Clean build cache
cargo clean && cargo build

# Check OpenSSL installation
pkg-config --libs openssl
```

**Runtime Errors**
```bash
# Check environment variables
env | grep -E "(ALLOWED_ORIGIN|RUST_LOG)"

# Verify file permissions
ls -la /path/to/files

# Check port availability
netstat -tulpn | grep 8080
```

**Performance Issues**
```bash
# Enable release mode
cargo run --release

# Monitor resource usage
htop
iostat -x 1

# Check logs for bottlenecks
RUST_LOG=debug cargo run
```

### Debug Mode

```bash
# Enable debug logging
RUST_LOG=debug cargo run

# Enable trace logging (very verbose)
RUST_LOG=trace cargo run

# Log only crypto operations
RUST_LOG=encryptx_backend::crypto=debug cargo run
```

---

## 🚀 Deployment

### Production Build

```bash
# Build optimized binary
cargo build --release

# Strip debug symbols (optional)
strip target/release/encryptx-backend

# Copy binary to deployment location
cp target/release/encryptx-backend /usr/local/bin/
```

### Docker Deployment

```bash
# Build Docker image
docker build -t encryptx-backend .

# Run container
docker run -p 8080:8080 \
  -e ALLOWED_ORIGIN=https://yourdomain.com \
  -e RUST_LOG=warn \
  encryptx-backend
```

### Systemd Service

```ini
# /etc/systemd/system/encryptx-backend.service
[Unit]
Description=EncryptX Backend Service
After=network.target

[Service]
Type=simple
User=encryptx
WorkingDirectory=/opt/encryptx
ExecStart=/usr/local/bin/encryptx-backend
Environment=ALLOWED_ORIGIN=https://yourdomain.com
Environment=RUST_LOG=warn
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 📚 Dependencies

### Core Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| `actix-web` | 4.x | Web framework |
| `aes-gcm` | 0.10.x | AES-GCM encryption |
| `argon2` | 0.5.x | Password hashing |
| `base64` | 0.21.x | Base64 encoding |
| `serde` | 1.x | Serialization |
| `tokio` | 1.x | Async runtime |
| `zstd` | 0.13.x | Compression |
| `zeroize` | 1.5.x | Secure memory clearing |

### Development Dependencies

| Crate | Purpose |
|-------|---------|
| `tempfile` | Temporary files for testing |
| `hurl` | HTTP API testing |

---

## 🤝 Contributing

### Development Setup

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install development tools
cargo install cargo-watch cargo-audit

# Clone and setup
git clone https://github.com/Amitminer/EncryptX.git
cd EncryptX/encryptx-backend
cargo build
```

### Code Style

- Follow `rustfmt` formatting
- Pass all `clippy` lints
- Add tests for new functionality
- Update documentation for API changes

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite: `cargo test`
4. Check formatting: `cargo fmt --check`
5. Run linter: `cargo clippy -- -D warnings`
6. Submit pull request with clear description

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🔗 Links

- **Main Repository**: [EncryptX](https://github.com/Amitminer/EncryptX)
- **Frontend Documentation**: [../encryptx-frontend/README.md](../encryptx-frontend/README.md)
- **Security Policy**: [../SECURITY.md](../SECURITY.md)
- **API Documentation**: [DOCS.md](DOCS.md)

---

<div align="center">

**Built with 🦀 Rust for maximum performance and security**

[⭐ Star the repo](https://github.com/Amitminer/EncryptX) • [🐛 Report Issues](https://github.com/Amitminer/EncryptX/issues) • [📖 Documentation](DOCS.md)

</div>