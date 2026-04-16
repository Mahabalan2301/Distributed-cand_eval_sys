FROM node:18-alpine

WORKDIR /app

# Copy shared modules first
COPY services/shared ./services/shared

# Copy auth-service specific files
COPY services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm install

COPY services/auth-service ./services/auth-service
RUN cd services/auth-service && npx prisma generate

EXPOSE 5000

# Start from the auth-service directory
WORKDIR /app/services/auth-service
CMD ["node", "index.js"]
