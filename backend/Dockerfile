FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Only copy the clean TypeORM files we created
COPY src/entities ./src/entities/
COPY src/database ./src/database/
COPY src/auth/auth.module.ts ./src/auth/
COPY src/auth/auth.service.ts ./src/auth/
COPY src/auth/auth.controller.ts ./src/auth/
COPY src/auth/auth0.strategy.ts ./src/auth/
COPY src/auth/jwt.strategy.ts ./src/auth/
COPY src/servers/servers.module.ts ./src/servers/
COPY src/servers/servers.service.ts ./src/servers/
COPY src/servers/servers.controller.ts ./src/servers/
COPY src/app.module.ts ./src/
COPY src/main.ts ./src/
COPY tsconfig.json ./

RUN npm run build

RUN mkdir -p /app/data

EXPOSE 5829

CMD ["node", "dist/main.js"]
