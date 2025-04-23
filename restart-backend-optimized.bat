@echo off
echo Restarting Instagram Clone Backend Server with memory optimizations...

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

:: Clean up any temporary files
echo Cleaning up temporary files...
if exist "%BACKEND_DIR%\uploads\temp" (
  rmdir /s /q "%BACKEND_DIR%\uploads\temp"
  mkdir "%BACKEND_DIR%\uploads\temp"
) else (
  mkdir "%BACKEND_DIR%\uploads\temp"
)

:: Start backend server with garbage collection enabled
echo Starting backend server with memory optimizations...
cd %BACKEND_DIR% && npm run dev:optimized

echo.
echo Backend server started with memory optimizations!
echo.
echo Backend running on http://localhost:60000
echo.
pause
