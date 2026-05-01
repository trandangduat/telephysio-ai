FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnspr4 \
    libnss3 \
    && rm -rf /var/lib/apt/lists/*

# Expo dev server relies on file watching and several open ports.
ENV EXPO_NO_TELEMETRY=1 \
    CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true

COPY package.json package-lock.json ./

RUN npm ci && npm install -g expo @expo/ngrok@^4.1.0

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npm", "run", "docker:start"]
