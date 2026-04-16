FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files (including local shared/logger.js)
COPY . .

EXPOSE 8000

CMD ["node", "index.js"]
