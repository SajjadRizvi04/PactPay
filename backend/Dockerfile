FROM node:24-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]