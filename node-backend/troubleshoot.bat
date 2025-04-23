@echo off
echo Instagram Backend Troubleshooting Tool
echo =====================================
echo.

:: Check if MongoDB is running
echo Checking if MongoDB is running...
mongod --version > nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB command not found. Make sure MongoDB is installed and in your PATH.
) else (
    echo MongoDB is installed.
)

:: Check if port 60000 is in use
echo.
echo Checking if port 60000 is already in use...
netstat -ano | findstr :60000
if %errorlevel% equ 0 (
    echo Port 60000 is in use. You may need to kill the process using this port.
    echo To kill the process, run: taskkill /F /PID [PID]
) else (
    echo Port 60000 is available.
)

:: Check for node_modules
echo.
echo Checking node_modules...
if not exist node_modules (
    echo node_modules directory not found. You need to run 'npm install'.
) else (
    echo node_modules directory exists.
)

:: Check for .env file
echo.
echo Checking .env file...
if not exist .env (
    echo .env file not found. You need to create one.
) else (
    echo .env file exists.
)

:: Check for nodemon
echo.
echo Checking nodemon installation...
call npm list nodemon > nul 2>&1
if %errorlevel% neq 0 (
    echo nodemon is not installed locally. Checking global installation...
    call npm list -g nodemon > nul 2>&1
    if %errorlevel% neq 0 (
        echo nodemon is not installed globally either. You should install it with 'npm install -g nodemon'.
    ) else (
        echo nodemon is installed globally.
    )
) else (
    echo nodemon is installed locally.
)

:: Offer to fix common issues
echo.
echo Troubleshooting options:
echo 1. Kill all Node.js processes
echo 2. Clear node_modules/.cache
echo 3. Reinstall nodemon
echo 4. Exit
echo.
set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo Killing all Node.js processes...
    taskkill /F /IM node.exe /T
    echo Done.
    pause
    goto :eof
)

if "%choice%"=="2" (
    echo Clearing node_modules/.cache...
    if exist node_modules\.cache (
        rmdir /s /q node_modules\.cache
        echo Done.
    ) else (
        echo Cache directory not found.
    )
    pause
    goto :eof
)

if "%choice%"=="3" (
    echo Reinstalling nodemon...
    call npm uninstall -g nodemon
    call npm install -g nodemon
    echo Done.
    pause
    goto :eof
)

if "%choice%"=="4" (
    goto :eof
)

echo Invalid choice.
pause
