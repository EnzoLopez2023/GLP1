# Stage 1: Install production dependencies (compiles native modules for target OS)
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Build the frontend
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Azure AD identifiers must be baked in at Vite build time.
# Pass them via docker compose build args (sourced from .env).
ARG VITE_AAD_CLIENT_ID
ARG VITE_AAD_TENANT_ID
ENV VITE_AAD_CLIENT_ID=$VITE_AAD_CLIENT_ID
ENV VITE_AAD_TENANT_ID=$VITE_AAD_TENANT_ID
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY server.js      ./
COPY package.json   ./

ENV NODE_ENV=production
ENV PORT=3004
ENV DB_PATH=/data/glp1.db

EXPOSE 3004

VOLUME ["/data"]

CMD ["node", "server.js"]
