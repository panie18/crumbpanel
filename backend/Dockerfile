FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

RUN mkdir -p /app/data

EXPOSE 5829

CMD sh -c "npx prisma migrate deploy && node dist/main.js"
