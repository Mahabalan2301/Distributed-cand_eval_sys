FROM node:18-alpine

WORKDIR /app

# Copy shared modules
COPY services/shared ./services/shared

# Copy worker specific files
COPY services/evaluation-worker/package*.json ./services/evaluation-worker/
RUN cd services/evaluation-worker && npm install

COPY services/evaluation-worker ./services/evaluation-worker
RUN cd services/evaluation-worker && npx prisma generate

WORKDIR /app/services/evaluation-worker
CMD ["node", "index.js"]
