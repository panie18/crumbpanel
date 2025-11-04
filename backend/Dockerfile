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

# Startup script with logging
RUN echo '#!/bin/sh\n\
echo "🚀 Starting CrumbPanel Backend..."\n\
echo "⏳ Waiting for database..."\n\
sleep 15\n\
echo "🔄 Running migrations..."\n\
npx prisma migrate deploy || echo "⚠️ Migration failed, continuing..."\n\
echo "✅ Starting server..."\n\
node dist/main.js' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
