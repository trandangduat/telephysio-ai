FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnspr4 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Expo dev server relies on file watching and several open ports.
ENV EXPO_NO_TELEMETRY=1 \
    CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true \
    ELECTRON_DISABLE_SANDBOX=1

COPY package.json package-lock.json ./

RUN npm ci

# Separate global install to cache the local dependencies, and add network retries for ngrok/expo
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install -g expo @expo/ngrok@^4.1.0

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npm", "run", "docker:start"]
