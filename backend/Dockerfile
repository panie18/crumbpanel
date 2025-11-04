FROM node:20-alpine

WORKDIR /app

# Copy only what we need
COPY package.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

# Copy only the new minimal source
COPY src ./src/
COPY tsconfig.json ./

RUN npm run build

RUN mkdir -p /app/data

EXPOSE 5829

CMD sh -c "npx prisma migrate deploy && node dist/main.js"
