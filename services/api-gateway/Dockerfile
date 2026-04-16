FROM node:18-alpine

WORKDIR /app

# Copy gateway specific files
COPY services/api-gateway/package*.json ./services/api-gateway/
RUN cd services/api-gateway && npm install

COPY services/api-gateway ./services/api-gateway

EXPOSE 8000

WORKDIR /app/services/api-gateway
CMD ["node", "index.js"]
