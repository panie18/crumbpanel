FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN mkdir -p /app/data

FROM node:18-alpine

RUN apk add --no-cache openjdk17-jre curl

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

RUN mkdir -p /app/minecraft-servers
RUN mkdir -p /app/data

EXPOSE 5829

CMD ["node", "dist/main.js"]
