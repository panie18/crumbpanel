FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create healthcheck script
RUN echo '#!/bin/sh\nwget --no-verbose --tries=1 --spider http://localhost/ || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD ["/healthcheck.sh"]

CMD ["nginx", "-g", "daemon off;"]
