FROM node:22-slim

WORKDIR /app

# Install OpenSSL (already included in slim, but ensure it's there)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm i

COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm run prisma:generate

CMD ["npm", "run", "dev"]