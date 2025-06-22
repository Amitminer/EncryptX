# encryptx-backend/Dockerfile
FROM rust:latest

WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev

# Copy project files
COPY . .

# Build in release mode
RUN cargo build --release

# Expose the port Railway expects
ENV PORT=8080
EXPOSE 8080

# Run the backend
CMD ["./target/release/encryptx-backend"]
