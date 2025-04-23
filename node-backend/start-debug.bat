@echo off
echo Starting Instagram Backend in debug mode...

:: Set environment variables
set PORT=60000
set NODE_ENV=development
set MONGO_URI=mongodb://localhost:27017/Lets_Talk
set DEBUG=express:*

:: Start the server with debugging enabled
node --inspect server.js

pause
