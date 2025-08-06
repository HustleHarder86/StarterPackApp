#!/bin/bash

# Script to switch between development and production environments

if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
    echo "Switching to development environment..."
    cp .env.development .env.local
    echo "✅ Now using local Railway API at http://localhost:3001"
    echo "📝 Run 'npm run dev' to start both servers"
elif [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    echo "Switching to production environment..."
    cp .env.production .env.local
    echo "✅ Now using production Railway API"
    echo "📝 Run 'npm run dev:frontend' to start only the frontend"
else
    echo "Usage: ./scripts/switch-env.sh [dev|prod]"
    echo "  dev  - Use local Railway API (localhost:3001)"
    echo "  prod - Use production Railway API"
    exit 1
fi