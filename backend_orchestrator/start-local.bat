@echo off
echo 🚀 Starting Docker Orchestrator Backend Locally...
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from env.example...
    copy env.example .env
    echo ⚠️  Please update .env with your configuration!
    echo.
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if Docker is running
echo 🔍 Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running!
    echo    Please start Docker Desktop
    exit /b 1
)
echo ✅ Docker is running
echo.

REM Start the server
echo 🚀 Starting backend server...
npm run dev


