# ============================================
# Vaelix Bank API - Production Docker Image
# ============================================
# Open Banking API built with Node.js, TypeScript & PostgreSQL
# Licensed under Apache 2.0
# ============================================

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies using npm
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npx tsc

# Production stage
FROM node:18-alpine AS production

# Install pnpm in production image
RUN npm install -g pnpm@9.15.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vaelix -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/data ./data

# Change ownership to non-root user
RUN chown -R vaelix:nodejs /app
USER vaelix

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# ============================================
# OCI Labels for container metadata
# ============================================
LABEL org.opencontainers.image.title="Vaelix Bank API" \
      org.opencontainers.image.description="Open Banking API built with Node.js, TypeScript & PostgreSQL" \
      org.opencontainers.image.url="https://github.com/vaelixbank/vaelix-api" \
      org.opencontainers.image.source="https://github.com/vaelixbank/vaelix-api" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="Vaelix Bank" \
      org.opencontainers.image.authors="Vaelix Bank Team <contact@vaelixbank.com>" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2024-01-01T00:00:00Z" \
      org.opencontainers.image.revision="main"
