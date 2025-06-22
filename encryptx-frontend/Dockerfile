# encryptx-frontend/Dockerfile

# Stage 1: Build the application
FROM node:latest AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code and build the app
COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:latest

WORKDIR /app

# Copy only what's needed for runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm ci --only=production

EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]
