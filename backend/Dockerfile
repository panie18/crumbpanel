FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache mysql-client

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5829

CMD sh -c "sleep 15 && npx prisma migrate deploy && node dist/main.js"
