FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server/package.json server/package-lock.json ./server/

RUN npm install -w server

COPY server/ ./server/

# Build TypeScript
RUN npm run build -w server

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server/dist/index.js"]
