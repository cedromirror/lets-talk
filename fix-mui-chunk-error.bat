@echo off
echo Fixing Material UI chunk loading errors...

:: Navigate to the frontend directory
cd frontend

:: Remove the cache directory
echo Removing node_modules\.cache directory...
if exist node_modules\.cache (
  rd /s /q node_modules\.cache
  echo Cache directory removed successfully.
) else (
  echo Cache directory does not exist.
)

:: Start the frontend application
echo Starting the frontend application...
set PORT=30000
set WDS_SOCKET_PORT=30000
set FAST_REFRESH=true
npm start
