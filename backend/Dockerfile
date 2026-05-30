# ──────────────────────────────────────────────────────────────
#  LazeePOS Backend — Production Image (Multi-Stage)
# ──────────────────────────────────────────────────────────────

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
# Hanya install production dependencies
RUN npm ci --omit=dev

# Stage 2: Setup Prisma
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
# Generate Prisma client untuk production
RUN npx prisma generate

# Stage 3: Production image (ringan)
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl

# Copy production node_modules dari stage deps
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Remove devDependencies & testing files
RUN rm -rf tests jest.config.js

ENV NODE_ENV=production
EXPOSE 5000

# Run Prisma migrations before starting the server
# This ensures the database schema is always up-to-date
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
