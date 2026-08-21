#!/bin/sh
echo "=== Starting Container ==="
echo "PORT is $PORT"
echo "Removing old X locks..."
rm -rf /tmp/.X*-lock
echo "Starting xvfb-run..."
xvfb-run --auto-servernum --server-args="-screen 0 1024x768x24" node dist/index.js
