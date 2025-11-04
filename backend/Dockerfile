FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 5829

# Startup script
CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && node dist/main.js"]
