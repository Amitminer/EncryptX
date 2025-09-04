# Security Policy

## Overview

EncryptX is designed with security as a primary concern. This document outlines our security practices, known limitations, and how to report security vulnerabilities.

## Security Features

### Cryptographic Security
- **AES-256-GCM**: Authenticated encryption providing both confidentiality and integrity
- **Argon2id**: Memory-hard password-based key derivation resistant to GPU attacks
- **Secure Random Generation**: Uses OS-provided cryptographically secure random number generators
- **Memory Safety**: Rust's memory safety prevents buffer overflows and memory corruption
- **Key Zeroization**: Encryption keys are automatically cleared from memory after use

### Application Security
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints are protected against abuse (10 requests/minute per IP)
- **Security Headers**: Comprehensive HTTP security headers prevent common attacks
- **CORS Protection**: Cross-origin requests are restricted to configured origins
- **File Size Limits**: Maximum 1GB file size prevents resource exhaustion
- **No Key Storage**: Encryption keys are never stored server-side

## Security Considerations

### Key Management
⚠️ **CRITICAL**: In key-based encryption mode, users are responsible for securely storing their encryption keys. Lost keys cannot be recovered.

### Password Security
- Minimum 8 character password length enforced
- No maximum password length limit (up to 1024 characters)
- Argon2id parameters: 64MB memory, 3 iterations, 1 thread

### Known Limitations
1. **No Key Recovery**: If you lose your password or key, your data cannot be recovered
2. **Client-Side Security**: The security of decrypted data depends on client-side security practices
3. **Metadata Leakage**: Original filenames are stored in encrypted file headers
4. **No Forward Secrecy**: Compromised keys can decrypt all files encrypted with those keys

## Threat Model

### Protected Against
- ✅ Data confidentiality (AES-256-GCM encryption)
- ✅ Data integrity (authenticated encryption)
- ✅ Password attacks (Argon2id with high memory cost)
- ✅ Timing attacks (constant-time operations where possible)
- ✅ Memory corruption (Rust memory safety)
- ✅ Common web attacks (security headers, input validation)

### Not Protected Against
- ❌ Quantum computer attacks (AES-256 provides ~128-bit quantum security)
- ❌ Side-channel attacks on the client device
- ❌ Malware on the client device
- ❌ Social engineering attacks
- ❌ Physical access to unlocked devices
- ❌ Compromised client environments

## Security Best Practices

### For Users
1. **Use Strong Passwords**: Use unique, complex passwords for each encrypted file
2. **Secure Key Storage**: Store encryption keys in a secure password manager
3. **Verify Downloads**: Ensure you're downloading from the official source
4. **Keep Software Updated**: Use the latest version of EncryptX
5. **Secure Environment**: Only decrypt files on trusted, secure devices

### For Developers
1. **Regular Updates**: Keep all dependencies updated
2. **Security Audits**: Regularly review code for security issues
3. **Secure Deployment**: Use HTTPS in production environments
4. **Environment Variables**: Never commit secrets to version control
5. **Monitoring**: Monitor for unusual activity and potential attacks

## Reporting Security Vulnerabilities

We take security vulnerabilities seriously. If you discover a security issue:

### What to Report
- Security vulnerabilities in the application code
- Cryptographic implementation issues
- Authentication or authorization bypasses
- Input validation vulnerabilities
- Denial of service vulnerabilities

### How to Report
1. **GitHub Issue**: Create a new issue in our [GitHub Repository URL](https://github.com/Amitminer/EncryptX/issues).
2. **Include**: Provide the following information in the issue description:
   - Detailed description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fix (if available)

| Date | Auditor | Scope | Status |
|------|---------|-------|--------|
| TBD | Internal | Code Review | Planned |
| TBD | External | Cryptographic Implementation | Planned |

## Compliance and Standards

### Cryptographic Standards
- **NIST SP 800-38D**: AES-GCM implementation
- **RFC 9106**: Argon2 password hashing
- **FIPS 140-2**: Random number generation (OS-provided)

### Security Guidelines
- **OWASP Top 10**: Protection against common web vulnerabilities
- **NIST Cybersecurity Framework**: Security controls implementation
- **ISO 27001**: Information security management principles

## Security Configuration

### Production Deployment
```bash
# Required environment variables
ALLOWED_ORIGIN=https://yourdomain.com
RUST_LOG=warn  # Reduce log verbosity in production

# Recommended additional security
# - Use HTTPS/TLS 1.3
# - Implement Web Application Firewall (WAF)
# - Enable DDoS protection
# - Use secure headers (implemented in middleware)
# - Regular security updates
```

### Development Environment
```bash
# Development settings
ALLOWED_ORIGIN=http://localhost:3000
RUST_LOG=debug

# Never use in production:
# - Self-signed certificates
# - Debug logging levels
# - Development CORS settings
```

## Incident Response

In case of a security incident:

1. **Immediate Response**
   - Assess the scope and impact
   - Contain the incident if possible
   - Document all actions taken

2. **Investigation**
   - Determine root cause
   - Identify affected systems/data
   - Collect evidence for analysis

3. **Recovery**
   - Implement fixes
   - Restore normal operations
   - Monitor for additional issues

4. **Post-Incident**
   - Conduct lessons learned review
   - Update security measures
   - Communicate with stakeholders

## Contact Information

- **Security Team**: [security@encryptx.example.com]
- **General Support**: [support@encryptx.example.com]
- **Project Repository**: [GitHub Repository URL]

---

**Last Updated**: September 2025
**Version**: 1.6

This security policy is reviewed and updated regularly to reflect current security practices and threat landscape.
