# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# openssl necessario para o Prisma (engine debian)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# ---- Runtime stage ----
FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# aplica migrations e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
