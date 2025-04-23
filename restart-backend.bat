@echo off
echo Restarting Instagram Clone Backend Server...

:: Set working directory
set BACKEND_DIR=node-backend

:: Kill any existing node processes that might be running on port 60000
echo Checking for processes on port 60000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
    echo Killing process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

:: Wait a moment for processes to fully terminate
timeout /t 3 /nobreak > nul

:: Start backend server with garbage collection enabled
echo Starting backend server with memory optimizations...
cd %BACKEND_DIR% && node --expose-gc --max-old-space-size=512 server.js

echo.
echo Backend server started!
echo.
echo Backend running on http://localhost:60000
echo.
pause
