# ==============================================================================
# Multi-stage Dockerfile for PaperlessFamily Frontend (React + Vite + TypeScript)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

LABEL stage="builder"
LABEL maintainer="PaperlessFamily DevOps Team"

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Accept build arguments
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build production bundle to dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runtime

LABEL maintainer="PaperlessFamily DevOps Team"
LABEL app="paperlessfamily-frontend"
LABEL description="Production Nginx container serving PaperlessFamily React application"

# Remove default nginx configuration and static assets
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
