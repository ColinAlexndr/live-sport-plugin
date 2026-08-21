FROM node:22-slim

# Install system deps for Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Install only Chromium for Playwright (skip Firefox/WebKit to save ~400MB)
RUN npx playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Build the bundled output in dist/
RUN npm run build

# Set default port
ENV PORT=7000
EXPOSE 7000

# Start the application
CMD ["npm", "start"]
