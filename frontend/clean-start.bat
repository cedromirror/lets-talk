@echo off
echo Cleaning cache and starting application...

:: Remove node_modules/.cache
echo Removing node_modules/.cache...
rmdir /s /q node_modules\.cache

:: Remove build directory if it exists
if exist build (
  echo Removing build directory...
  rmdir /s /q build
)

:: Clear browser cache for localhost:30000
echo Please close all browser windows with the application open.
pause

:: Start the application
echo Starting application...
set PORT=30000
set WDS_SOCKET_PORT=30000
set FAST_REFRESH=true
npm start
