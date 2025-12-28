FROM node:22

WORKDIR /app

# Install git and clear cache to keep the image small
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Added --legacy-peer-deps to fix the "jimp" conflict from your logs
RUN npm install --legacy-peer-deps

# Ensure the session folder exists for your loadSession function
RUN mkdir -p gift/session

COPY . .

EXPOSE 4420

CMD ["npm", "start"]

