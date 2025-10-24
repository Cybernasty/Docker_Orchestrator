#!/bin/bash

echo "🚀 Starting Docker Orchestrator Backend Locally..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please update .env with your configuration!"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "⚠️  MongoDB not detected!"
    echo "   Start MongoDB with: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
fi

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start the server
echo "🚀 Starting backend server..."
npm run dev


