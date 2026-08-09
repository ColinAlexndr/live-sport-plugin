#!/bin/bash
# Install dependencies in the Web Service environment which has higher RAM limits than SSH
echo "Starting Alwaysdata setup..."
npm install --omit=dev --no-audit --no-fund --loglevel=error
echo "Starting Node.js application..."
node src/index.js
