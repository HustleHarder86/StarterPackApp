#!/bin/bash

echo "🔍 Testing Development Environment Setup..."
echo ""

# Test Vercel Dev
echo "1️⃣ Testing Vercel Dev Server..."
timeout 5 vercel dev --yes 2>&1 | grep -E "Ready|Available|Error" &
VERCEL_PID=$!

sleep 3

# Check if Vercel is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Vercel dev server is running at http://localhost:3000"
else
    echo "❌ Vercel dev server failed to start"
fi

# Kill Vercel test
kill $VERCEL_PID 2>/dev/null

echo ""
echo "2️⃣ Testing Railway API Server..."

# Test Railway API
cd railway-api
timeout 5 npm run dev 2>&1 | grep -E "Server started|listening|Error" &
RAILWAY_PID=$!

sleep 3

# Check if Railway is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Railway API is running at http://localhost:3001"
else
    echo "❌ Railway API failed to start"
fi

# Kill Railway test
kill $RAILWAY_PID 2>/dev/null

echo ""
echo "📋 Summary:"
echo "- To start both servers: npm run dev"
echo "- To start only frontend: npm run dev:frontend"
echo "- To start only backend: npm run dev:backend"
echo ""
echo "💡 Tip: Use two separate terminals for better control"