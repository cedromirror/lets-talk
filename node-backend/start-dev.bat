@echo off
echo Starting Instagram Backend in development mode with improved refreshing...

:: Kill any existing node processes that might be running on port 60000
echo Checking for processes on port 60000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
    echo Killing process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

:: Wait a moment for processes to fully terminate
timeout /t 2 /nobreak > nul

:: Clear node_modules/.cache if it exists
if exist node_modules\.cache (
    echo Clearing node_modules/.cache...
    rmdir /s /q node_modules\.cache
)

:: Check if node_modules exists, if not install dependencies
if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    call npm install
)

:: Start the server with improved nodemon settings
echo Starting server with enhanced file watching...

:: Set NODE_ENV to development explicitly
set NODE_ENV=development

:: Start with nodemon using the updated configuration
call npm run dev:watch

echo.
echo If the server doesn't start properly, press Ctrl+C to exit and run this script again.
echo You can also try running 'npm run dev:restart' manually.
