FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src/
COPY tsconfig.json ./

RUN npm run build

RUN mkdir -p /app/data

EXPOSE 5829

CMD ["node", "dist/main.js"]
