# encryptx-backend/Dockerfile

FROM rust:latest as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source and build
COPY . .
RUN cargo build --release

# --- Production image ---
FROM debian:buster-slim

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy built binary from builder
COPY --from=builder /app/target/release/encryptx-backend .

EXPOSE 8080

# Run the app
CMD ["./encryptx-backend"]
