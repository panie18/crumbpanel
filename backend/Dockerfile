FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client before build
RUN npx prisma generate

RUN npm run build

FROM node:20-bullseye-slim

WORKDIR /app
ENV NODE_ENV=production

# Ensure SSL libs present for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# SQLite DB location (mounted via compose)
RUN mkdir -p /app/data

EXPOSE 5829

# Sync schema, seed admin, start API
CMD sh -c "npx prisma db push && node dist/scripts/seed.js && node dist/main.js"
