FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npx prisma generate

EXPOSE 5000

CMD ["node", "index.js"]