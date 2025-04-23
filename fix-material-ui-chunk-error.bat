@echo off
echo Fixing Material UI chunk loading errors...

:: Set working directory
set FRONTEND_DIR=frontend

:: Kill any existing node processes that might be running on port 30000
echo Checking for processes on port 30000 (frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :30000') do (
    echo Killing process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

:: Wait a moment for processes to fully terminate
timeout /t 3 /nobreak > nul

:: Clear browser cache for localhost:30000
echo Please close all browser windows with the application open.
pause

:: Clear node_modules/.cache if it exists in frontend
if exist %FRONTEND_DIR%\node_modules\.cache (
    echo Clearing frontend node_modules/.cache...
    rmdir /s /q %FRONTEND_DIR%\node_modules\.cache
)

:: Clear service worker cache
echo Clearing service worker cache...
echo This will happen automatically when the app restarts with the updated service worker.

:: Start frontend server
echo Starting frontend server with clean cache...
cd %FRONTEND_DIR% && npm run start:clean

echo.
echo If the issue persists, try running "npm run deep-clean" followed by "npm start"
echo.
