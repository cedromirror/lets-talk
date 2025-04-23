@echo off
echo Fixing chunk loading errors for Material UI components...

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

:: Remove node_modules/.cache
echo Removing node_modules/.cache...
rmdir /s /q node_modules\.cache

:: Remove build directory if it exists
if exist build (
  echo Removing build directory...
  rmdir /s /q build
)

:: Start the application with a clean cache
echo Starting application with a clean cache...
set PORT=30000
set WDS_SOCKET_PORT=30000
set FAST_REFRESH=true
npm start

echo.
echo If the issue persists, try running "npm run deep-clean" followed by "npm start"
echo.
