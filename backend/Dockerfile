FROM node:20-alpine

WORKDIR /app

# Install MySQL client for healthcheck
RUN apk add --no-cache mysql-client

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5829

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Waiting for database..."\n\
for i in $(seq 1 60); do\n\
  if mysql -h db -u mc_admin -pmc_password mc_panel -e "SELECT 1" > /dev/null 2>&1; then\n\
    echo "Database is ready!"\n\
    break\n\
  fi\n\
  echo "Waiting... ($i/60)"\n\
  sleep 2\n\
done\n\
echo "Running migrations..."\n\
npx prisma migrate deploy || echo "Migration failed, but continuing..."\n\
echo "Starting backend..."\n\
node dist/main.js' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
