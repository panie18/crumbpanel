FROM node:20-alpine

WORKDIR /app

# Install tools
RUN apk add --no-cache mysql-client curl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5829

# Simple startup with lots of logging
CMD sh -c "\
echo '=== CRUMBPANEL BACKEND STARTUP ==='; \
echo 'Waiting 30 seconds for database...'; \
sleep 30; \
echo 'Testing database connection...'; \
mysql -h db -u mc_admin -pmc_password mc_panel -e 'SELECT 1' && echo 'DB OK' || echo 'DB FAILED'; \
echo 'Running migrations...'; \
npx prisma migrate deploy || echo 'Migration failed but continuing...'; \
echo 'Starting NestJS...'; \
node dist/main.js"
