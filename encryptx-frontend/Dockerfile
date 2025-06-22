# encryptx-frontend/Dockerfile
# Stage 1: Build the application
FROM node:latest AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Stage 2: Create the production image
FROM node:latest

WORKDIR /app

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]
