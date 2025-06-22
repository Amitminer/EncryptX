# encryptx-backend/Dockerfile
FROM rust:latest

WORKDIR /app
COPY . .

# Build dependencies first (for caching)
RUN apt-get update && apt-get install -y pkg-config libssl-dev && \
    cargo build --release

CMD ["cargo", "run", "--release"]
