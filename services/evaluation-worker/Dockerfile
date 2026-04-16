FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files (including local shared/logger.js)
COPY . .

# Generate Prisma client
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npx prisma generate

# No port exposed for worker (usually)
# EXPOSE 5001

CMD ["node", "index.js"]
