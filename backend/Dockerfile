FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install tools for healthcheck and DB access
RUN apk add --no-cache postgresql-client wget

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Create entrypoint script
RUN echo '#!/bin/sh\n\
echo "⏳ Waiting for database..."\n\
sleep 5\n\
echo "🔄 Running migrations..."\n\
npx prisma migrate deploy || echo "⚠️ Migration failed, continuing..."\n\
echo "🚀 Starting backend..."\n\
node dist/main.js' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 5829

CMD ["/app/entrypoint.sh"]
