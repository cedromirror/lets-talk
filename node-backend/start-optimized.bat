@echo off
echo Starting Instagram Backend with memory optimizations...

:: Set environment variables
set PORT=60000
set NODE_ENV=development
set MONGO_URI=mongodb://localhost:27017/Lets_Talk

:: Clean up any temporary files
echo Cleaning up temporary files...
if exist "uploads\temp" (
  rmdir /s /q "uploads\temp"
  mkdir "uploads\temp"
) else (
  mkdir "uploads\temp"
)

:: Start the server with garbage collection enabled and memory limits
echo Starting server with garbage collection enabled...
node --expose-gc --max-old-space-size=512 server.js

pause
