#!/bin/bash

# Start script for Railway deployment
echo "Starting StarterPackApp Railway API..."

# Start the main server
node src/server.js &
SERVER_PID=$!

# Wait for server to initialize
echo "Waiting for server to initialize..."
sleep 3

# Start the workers
echo "Starting workers..."
node src/start-workers.js &
WORKER_PID=$!

echo "Server PID: $SERVER_PID"
echo "Worker PID: $WORKER_PID"

# Wait for any process to exit
wait -n

# Exit with status of first process to exit
exit $?