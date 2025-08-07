# Production-ready Node.js API with security optimizations and RSA key generation

FROM node:lts-alpine

# Install OpenSSL for RSA key generation and curl for healthcheck
RUN apk add --no-cache openssl curl dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Build arguments
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV} \
    PORT=8080 \
    HUSKY=0

# Install dependencies
RUN npm ci --omit=dev --silent

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create directories with proper ownership
RUN mkdir -p logs keys && \
    chown -R nodejs:nodejs logs keys

# Generate RSA keys for production only
RUN if [ "$NODE_ENV" = "production" ]; then \
        openssl genrsa -out keys/private.pem 2048 && \
        openssl rsa -in keys/private.pem -pubout -out keys/public.pem && \
        chmod 400 keys/private.pem && \
        chmod 444 keys/public.pem && \
        chown nodejs:nodejs keys/*.pem; \
    fi

# Switch to non-root user
USER nodejs

EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "run", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
