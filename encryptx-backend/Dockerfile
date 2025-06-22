# encryptx-backend/Dockerfile
FROM rust:latest

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev

# Copy only Cargo.toml first to cache dependencies
COPY Cargo.toml ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Now copy the full source
COPY . .

# Build actual app
RUN cargo build --release

# Run the app
CMD ["./target/release/encryptx-backend"]
