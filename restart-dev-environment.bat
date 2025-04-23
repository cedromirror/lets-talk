@echo off
echo Restarting Instagram Clone Development Environment...

:: Set working directories
set BACKEND_DIR=node-backend
set FRONTEND_DIR=frontend

:: Kill any existing node processes that might be running on ports 60000 and 30000
echo Checking for processes on port 60000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
    echo Killing process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

echo Checking for processes on port 30000 (frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :30000') do (
    echo Killing process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

:: Also try to kill any nodemon processes
echo Checking for nodemon processes...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" ^| findstr "node.exe"') do (
    echo Killing node process with PID %%a...
    taskkill /F /PID %%a 2>nul
)

:: Wait a moment for processes to fully terminate
timeout /t 3 /nobreak > nul

:: Clear node_modules/.cache if it exists in backend
if exist %BACKEND_DIR%\node_modules\.cache (
    echo Clearing backend node_modules/.cache...
    rmdir /s /q %BACKEND_DIR%\node_modules\.cache
)

:: Clear node_modules/.cache if it exists in frontend
if exist %FRONTEND_DIR%\node_modules\.cache (
    echo Clearing frontend node_modules/.cache...
    rmdir /s /q %FRONTEND_DIR%\node_modules\.cache
)

:: Start backend server in a new window
echo Starting backend server...
start "Instagram Backend" cmd /c "cd %BACKEND_DIR% && call restart-dev.bat"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

:: Start frontend server in a new window
echo Starting frontend server...
start "Instagram Frontend" cmd /c "cd %FRONTEND_DIR% && npm start"

echo.
echo Development environment restarted!
echo.
echo Backend running on http://localhost:60000
echo Frontend running on http://localhost:30000
echo.
echo Press any key to exit this window (servers will continue running)...
pause > nul
