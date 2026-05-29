# ──────────────────────────────────────────────────────────────
#  LazeePOS Frontend — Production Image (Multi-Stage)
#  Stage 1: Build React app dengan Vite
#  Stage 2: Serve static files via Nginx (ringan & cepat)
# ──────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

# Build argument untuk API URL (bisa di-override saat build)
ARG VITE_API_URL=/api/v1
ARG VITE_MIDTRANS_ENV=production
ARG VITE_MIDTRANS_CLIENT_KEY=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MIDTRANS_ENV=$VITE_MIDTRANS_ENV
ENV VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY

# Build production bundle
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:1.27-alpine AS production

# Copy hasil build dari stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config untuk SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
