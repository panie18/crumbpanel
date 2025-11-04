FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Erstelle Datenbank-Ordner
RUN mkdir -p /app/data

EXPOSE 5829

# Führe Prisma-Migration aus und starte dann die App
CMD npx prisma migrate deploy && node dist/index.js
