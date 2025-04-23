@echo off
echo Stopping Instagram Clone Development Environment...

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

echo.
echo All development servers have been stopped.
echo.
echo Press any key to exit...
pause > nul
