FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5829

CMD sh -c "sleep 20 && npx prisma migrate deploy && node dist/main.js"
