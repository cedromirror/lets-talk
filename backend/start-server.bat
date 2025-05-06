@echo off
echo Starting Instagram Backend Server...

:: Set environment variables
set PORT=60000
set NODE_ENV=development

:: Start the server with garbage collection enabled
node --expose-gc --max-old-space-size=512 server.js

echo.
echo Backend server started!
echo.
echo Backend running on http://localhost:60000
echo.
pause
