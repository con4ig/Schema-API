# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root and client package files
COPY package.json ./
COPY client/package.json client/package-lock.json ./client/

# Install dependencies (only client)
RUN npm install -w client

# Copy client source
COPY client/ ./client/

# Build the app
RUN npm run build -w client

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
