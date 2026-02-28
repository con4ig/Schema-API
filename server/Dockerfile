# Use Node.js 20 (Required for Vite 7 consistency)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json ./
COPY server/package.json server/package-lock.json ./server/

# Install dependencies (only server)
RUN npm install -w server

# Copy server source
COPY server/ ./server/

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "start", "-w", "server"]
