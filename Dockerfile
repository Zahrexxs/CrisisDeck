# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files (package-lock.json is committed, so `npm ci` is reproducible)
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Remove devDependencies
RUN npm prune --omit=dev

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only necessary files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/config ./config

# Set ownership to non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

EXPOSE 3000

# Run node directly so it receives SIGTERM as PID 1 and can shut down gracefully.
CMD ["node", "src/server.js"]
