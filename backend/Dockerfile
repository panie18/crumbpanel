FROM node:18-alpine

# Install Java 21 (required for Minecraft 1.21+)
RUN apk add --no-cache openjdk21-jre

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy all source files including plugins
COPY src/entities ./src/entities/
COPY src/database ./src/database/
COPY src/auth ./src/auth/
COPY src/servers ./src/servers/
COPY src/plugins ./src/plugins/
COPY src/app.module.ts ./src/
COPY src/main.ts ./src/
COPY tsconfig.json ./

RUN npm run build

RUN mkdir -p /app/data
RUN mkdir -p /app/minecraft-servers
RUN mkdir -p /app/backups

EXPOSE 5829

CMD ["node", "dist/main"]
