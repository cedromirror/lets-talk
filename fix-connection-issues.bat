@echo off
echo Instagram Clone - Connection Issue Fixer
echo =======================================
echo.
echo This script will help fix common connection issues between the frontend and backend.
echo.

:MENU
echo Please select an option:
echo 1. Check if backend server is running
echo 2. Check MongoDB connection
echo 3. Restart backend server
echo 4. Restart frontend server
echo 5. Restart both servers
echo 6. Fix port conflicts
echo 7. Run connection tests
echo 8. Exit
echo.

set /p choice=Enter your choice (1-8): 

if "%choice%"=="1" goto CHECK_BACKEND
if "%choice%"=="2" goto CHECK_MONGODB
if "%choice%"=="3" goto RESTART_BACKEND
if "%choice%"=="4" goto RESTART_FRONTEND
if "%choice%"=="5" goto RESTART_BOTH
if "%choice%"=="6" goto FIX_PORTS
if "%choice%"=="7" goto RUN_TESTS
if "%choice%"=="8" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:CHECK_BACKEND
echo.
echo Checking if backend server is running...
netstat -ano | findstr :60000
if %ERRORLEVEL% EQU 0 (
  echo Backend server is running on port 60000.
) else (
  echo Backend server is NOT running on port 60000.
  echo Would you like to start it? (Y/N)
  set /p start_backend=
  if /i "%start_backend%"=="Y" (
    cd node-backend
    start cmd /k "npm run dev"
    cd ..
    echo Backend server starting...
  )
)
echo.
pause
goto MENU

:CHECK_MONGODB
echo.
echo Checking MongoDB connection...
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/Lets_Talk', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log('MongoDB connected successfully'); mongoose.connection.close(); }).catch(err => console.error('MongoDB connection error:', err))"
echo.
pause
goto MENU

:RESTART_BACKEND
echo.
echo Restarting backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
  echo Killing process with PID %%a...
  taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak > nul
cd node-backend
start cmd /k "npm run dev"
cd ..
echo Backend server restarted.
echo.
pause
goto MENU

:RESTART_FRONTEND
echo.
echo Restarting frontend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :30000') do (
  echo Killing process with PID %%a...
  taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak > nul
cd frontend
start cmd /k "npm start"
cd ..
echo Frontend server restarted.
echo.
pause
goto MENU

:RESTART_BOTH
echo.
echo Restarting both servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
  echo Killing backend process with PID %%a...
  taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :30000') do (
  echo Killing frontend process with PID %%a...
  taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak > nul
cd node-backend
start cmd /k "npm run dev"
cd ..
timeout /t 5 /nobreak > nul
cd frontend
start cmd /k "npm start"
cd ..
echo Both servers restarted.
echo.
pause
goto MENU

:FIX_PORTS
echo.
echo Checking for port conflicts...
echo.
echo Checking port 60000 (backend)...
netstat -ano | findstr :60000
if %ERRORLEVEL% EQU 0 (
  echo Port 60000 is in use. Would you like to free it? (Y/N)
  set /p free_backend=
  if /i "%free_backend%"=="Y" (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :60000') do (
      echo Killing process with PID %%a...
      taskkill /F /PID %%a 2>nul
    )
    echo Port 60000 should now be free.
  )
) else (
  echo Port 60000 is free.
)

echo.
echo Checking port 30000 (frontend)...
netstat -ano | findstr :30000
if %ERRORLEVEL% EQU 0 (
  echo Port 30000 is in use. Would you like to free it? (Y/N)
  set /p free_frontend=
  if /i "%free_frontend%"=="Y" (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :30000') do (
      echo Killing process with PID %%a...
      taskkill /F /PID %%a 2>nul
    )
    echo Port 30000 should now be free.
  )
) else (
  echo Port 30000 is free.
)
echo.
pause
goto MENU

:RUN_TESTS
echo.
echo Running connection tests...
call test-connection.bat
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using the Connection Issue Fixer.
echo Goodbye!
echo.
exit /b 0
