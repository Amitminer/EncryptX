# Multi-stage build for optimized Rust backend
FROM rust:1.89-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
	musl-dev \
	pkgconfig \
	openssl-dev \
	openssl-libs-static

WORKDIR /app

# Copy dependency files first for better caching
COPY Cargo.toml ./
# Note: We don't copy Cargo.lock as it might not exist or be compatible

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy source code and build the actual application
COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

# Production stage with minimal Alpine image
FROM alpine:3.19

# Install only runtime dependencies
RUN apk add --no-cache \
	ca-certificates \
	libgcc \
	wget

# Create non-root user for security
RUN addgroup -g 1001 -S encryptx && \
	adduser -S encryptx -u 1001 -G encryptx

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/encryptx-backend ./encryptx-backend

# Change ownership to non-root user
RUN chown -R encryptx:encryptx /app
USER encryptx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./encryptx-backend"]
