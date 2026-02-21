# Stage 1: Build
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Prune devDependencies for production
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Stage 2: Production
FROM public.ecr.aws/docker/library/node:20-alpine AS production

# Add security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Set environment variables for ECS compatibility
ENV NODE_ENV=production
ENV PORT=3001

# Item service URL (ECS service discovery compatible)
# In ECS, this would be set to something like: http://item-service.local:3000
ENV ITEM_SERVICE_URL=http://localhost:3000

# HTTP client configuration
ENV HTTP_TIMEOUT_MS=30000
ENV HTTP_KEEPALIVE_TIMEOUT_MS=60000
ENV HTTP_MAX_CONNECTIONS=100
ENV HTTP_MAX_CONNECTIONS_PER_HOST=10

# Retry configuration
ENV RETRY_MAX_ATTEMPTS=3
ENV RETRY_BASE_DELAY_MS=100
ENV RETRY_MAX_DELAY_MS=5000

# Circuit breaker configuration
ENV CIRCUIT_BREAKER_THRESHOLD=5
ENV CIRCUIT_BREAKER_TIMEOUT_MS=30000
ENV CIRCUIT_BREAKER_RESET_TIMEOUT_MS=30000

# Logging and metrics
ENV LOG_LEVEL=info
ENV METRICS_ENABLED=true

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health/live || exit 1

# Expose the application port
EXPOSE 3001

# Switch to non-root user
USER nodejs

# Start the application
CMD ["node", "dist/index.js"]
