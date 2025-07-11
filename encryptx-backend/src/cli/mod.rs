//!
//! This is EncryptX, but in CLI form for CLI users.
//!
use crate::crypto;
use base64::{Engine, engine::general_purpose};
use clap::{Parser, Subcommand};
use rand::RngCore;
use std::fs;
use std::io;
use std::path::Path;

/// Command-line interface for EncryptX Backend.
///
/// Use this to encrypt or decrypt files with a single command. It's fast, secure, and easy to use!
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

/// CLI subcommands for encryption and decryption.
#[derive(Subcommand)]
pub enum Commands {
    /// Encrypt a file using a password or key.
    ///
    /// Example:
    ///   encrypt --file secret.txt --password supersecret
    ///   encrypt --file secret.txt --key BASE64KEY
    ///   encrypt --file secret.txt --output encrypted.xd
    Encrypt {
        /// Path to the file to encrypt
        #[arg(short, long)]
        file: String,
        /// Password to use for encryption (optional)
        #[arg(short, long)]
        password: Option<String>,
        /// Key to use for encryption (base64, optional; if not provided, random key is generated and printed)
        #[arg(short, long)]
        key: Option<String>,
        /// Output file path (optional; defaults to <basename>.xd)
        #[arg(short, long)]
        output: Option<String>,
        /// Force overwrite if output file exists
        #[arg(long)]
        force: bool,
    },
    /// Decrypt a file using a password or key.
    ///
    /// Example:
    ///   decrypt --file secret.xd --password supersecret
    ///   decrypt --file secret.xd --key BASE64KEY
    ///   decrypt --file secret.xd --output decrypted.txt
    Decrypt {
        /// Path to the file to decrypt
        #[arg(short, long)]
        file: String,
        /// Password to use for decryption (optional)
        #[arg(short, long)]
        password: Option<String>,
        /// Key to use for decryption (base64, optional)
        #[arg(short, long)]
        key: Option<String>,
        /// Output file path (optional; defaults to original filename from encrypted file)
        #[arg(short, long)]
        output: Option<String>,
        /// Force overwrite if output file exists
        #[arg(long)]
        force: bool,
    },
}

/// Custom error type for CLI operations
#[derive(Debug)]
pub enum CliError {
    Io(io::Error),
    Crypto(String),
    InvalidInput(String),
}

impl std::fmt::Display for CliError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CliError::Io(e) => write!(f, "File operation failed: {e}"),
            CliError::Crypto(e) => write!(f, "Cryptographic operation failed: {e}"),
            CliError::InvalidInput(e) => write!(f, "Invalid input: {e}"),
        }
    }
}

impl std::error::Error for CliError {}

impl From<io::Error> for CliError {
    fn from(error: io::Error) -> Self {
        CliError::Io(error)
    }
}

impl From<CliError> for io::Error {
    fn from(error: CliError) -> Self {
        match error {
            CliError::Io(e) => e,
            CliError::Crypto(e) => io::Error::other(e),
            CliError::InvalidInput(e) => io::Error::new(io::ErrorKind::InvalidInput, e),
        }
    }
}

/// Validates that a file exists and is readable
fn validate_input_file(file_path: &str) -> Result<(), CliError> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err(CliError::InvalidInput(format!(
            "File '{file_path}' does not exist"
        )));
    }
    if !path.is_file() {
        return Err(CliError::InvalidInput(format!(
            "'{file_path}' is not a file"
        )));
    }
    // Check if file is readable by attempting to open it
    match fs::File::open(path) {
        Ok(_) => Ok(()),
        Err(e) => Err(CliError::Io(e)),
    }
}

/// Checks if output file exists and handles overwrite logic
fn check_output_file(output_path: &str, force: bool) -> Result<(), CliError> {
    let path = Path::new(output_path);
    if path.exists() {
        if !force {
            return Err(CliError::InvalidInput(format!(
                "Output file '{output_path}' already exists. Use --force to overwrite"
            )));
        }
        // Check if we can write to the existing file
        match fs::OpenOptions::new().write(true).open(path) {
            Ok(_) => Ok(()),
            Err(e) => Err(CliError::Io(io::Error::new(
                io::ErrorKind::PermissionDenied,
                format!("Cannot overwrite '{output_path}': {e}"),
            ))),
        }
    } else {
        // Only check parent if it exists (i.e., not current directory)
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() && !parent.exists() {
                return Err(CliError::InvalidInput(format!(
                    "Parent directory '{}' does not exist",
                    parent.display()
                )));
            }
        }
        Ok(())
    }
}

/// Validates and decodes a base64 key
fn validate_key(key_b64: &str) -> Result<Vec<u8>, CliError> {
    let key = general_purpose::STANDARD
        .decode(key_b64)
        .map_err(|e| CliError::InvalidInput(format!("Invalid base64 key: {e}")))?;

    if key.len() != 32 {
        return Err(CliError::InvalidInput(format!(
            "Key must be 32 bytes (256 bits), got {} bytes",
            key.len()
        )));
    }

    Ok(key)
}

/// Generates a default output filename for encryption
fn generate_encrypt_output(input_file: &str) -> String {
    let path = Path::new(input_file);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    format!("{stem}.xd")
}

/// Runs the CLI. Returns Ok(true) if a CLI command was run, Ok(false) if not.
///
/// - Encrypt: Writes <basename>.xd as output. Prints random key if generated (copy it somewhere safe!).
/// - Decrypt: Writes the original filename from the encrypted file header.
/// - Returns Ok(false) if no CLI command is given (so the server can start).
///
/// # Security Note
/// If you forget your password or key, not even we can help you. That's real security!
pub async fn run_cli() -> Result<bool, CliError> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Encrypt {
            file,
            password,
            key,
            output,
            force,
        }) => {
            // Validate input file
            validate_input_file(&file)?;

            // Validate that either password or key is provided (not both)
            match (&password, &key) {
                (Some(_), Some(_)) => {
                    return Err(CliError::InvalidInput(
                        "Cannot specify both password and key. Choose one.".to_string(),
                    ));
                }
                (None, None) => {
                    // This is fine, we'll generate a random key
                }
                _ => {} // One of them is provided, which is fine
            }

            // Validate key if provided
            let validated_key = if let Some(ref key_str) = key {
                Some(validate_key(key_str)?)
            } else {
                None
            };

            // Determine output file
            let output_file = output.unwrap_or_else(|| generate_encrypt_output(&file));

            // Check output file
            check_output_file(&output_file, force)?;

            // Read input file
            let data = fs::read(&file).map_err(|e| {
                CliError::Io(io::Error::new(
                    e.kind(),
                    format!("Failed to read input file '{file}': {e}"),
                ))
            })?;

            // Get original filename for metadata
            let orig_name = Path::new(&file)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("file.bin");

            println!("🔐 Encrypting file '{file}'...");

            // Perform encryption
            let encrypted = if let Some(password) = password {
                // Password-based encryption (Argon2id)
                let mut salt = [0u8; 32];
                rand::rngs::OsRng
                    .try_fill_bytes(&mut salt)
                    .map_err(|e| CliError::Crypto(format!("Failed to generate salt: {e}")))?;

                crypto::encrypt_with_password_async(&data, password, orig_name, salt.to_vec())
                    .await
                    .map_err(|e| CliError::Crypto(format!("Password encryption failed: {e}")))?
            } else {
                // Key-based encryption (AES-256-GCM)
                let final_key = if let Some(key) = validated_key {
                    key
                } else {
                    // Generate random key
                    let mut k = [0u8; 32];
                    rand::rngs::OsRng
                        .try_fill_bytes(&mut k)
                        .map_err(|e| CliError::Crypto(format!("Failed to generate key: {e}")))?;

                    let key_b64 = general_purpose::STANDARD.encode(k);
                    println!("✨ Generated random key (base64): {key_b64}");
                    println!(
                        "💡 Save this key somewhere safe! You'll need it to decrypt your file."
                    );
                    println!("⚠️  This key will NOT be shown again!");

                    k.to_vec()
                };

                crypto::encrypt_with_header(&data, &final_key, orig_name)
                    .map_err(|e| CliError::Crypto(format!("Key encryption failed: {e}")))?
            };

            // Write encrypted file
            fs::write(&output_file, &encrypted).map_err(|e| {
                CliError::Io(io::Error::new(
                    e.kind(),
                    format!("Failed to write encrypted file '{output_file}': {e}"),
                ))
            })?;

            println!("✅ Encrypted file written to '{output_file}'");
            println!("📊 Original size: {} bytes", data.len());
            println!("📊 Encrypted size: {} bytes", encrypted.len());

            Ok(true)
        }

        Some(Commands::Decrypt {
            file,
            password,
            key,
            output,
            force,
        }) => {
            // Validate input file
            validate_input_file(&file)?;

            // Validate that either password or key is provided (not both)
            match (&password, &key) {
                (Some(_), Some(_)) => {
                    return Err(CliError::InvalidInput(
                        "Cannot specify both password and key. Choose one.".to_string(),
                    ));
                }
                (None, None) => {
                    return Err(CliError::InvalidInput(
                        "Must specify either password or key for decryption.".to_string(),
                    ));
                }
                _ => {} // One of them is provided, which is correct
            }

            // Validate key if provided
            let validated_key = if let Some(ref key_str) = key {
                Some(validate_key(key_str)?)
            } else {
                None
            };

            // Read encrypted file
            let data = fs::read(&file).map_err(|e| {
                CliError::Io(io::Error::new(
                    e.kind(),
                    format!("Failed to read encrypted file '{file}': {e}"),
                ))
            })?;

            println!("🔓 Decrypting file '{file}'...");

            // Perform decryption
            let (decrypted, orig_filename) = if let Some(password) = password {
                // Password-based decryption
                crypto::decrypt_with_password_async(&data, password)
                    .await
                    .map_err(|e| CliError::Crypto(format!("Password decryption failed: {e}")))?
            } else {
                // Key-based decryption
                let key_ref = validated_key.as_deref();
                crypto::decrypt_with_header(&data, key_ref)
                    .map_err(|e| CliError::Crypto(format!("Key decryption failed: {e}")))?
            };

            // Determine output file
            let output_file = output.unwrap_or(orig_filename);

            // Check output file
            check_output_file(&output_file, force)?;

            // Write decrypted file
            fs::write(&output_file, &decrypted).map_err(|e| {
                CliError::Io(io::Error::new(
                    e.kind(),
                    format!("Failed to write decrypted file '{output_file}': {e}"),
                ))
            })?;

            println!("✅ Decrypted file written to '{output_file}'");
            println!("📊 Decrypted size: {} bytes", decrypted.len());

            Ok(true)
        }

        None => Ok(false),
    }
}
