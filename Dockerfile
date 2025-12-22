FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 4420

CMD ["npm", "start"]
