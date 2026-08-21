#!/bin/sh
echo "=== Starting Container ==="
echo "PORT is $PORT"
echo "Removing old X locks..."
rm -rf /tmp/.X*-lock /tmp/.X11-unix
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1024x768x24 -nolisten tcp -ac &
export DISPLAY=:99

echo "Waiting for Xvfb to be ready..."
sleep 2

echo "Starting Node app..."
node dist/index.js
