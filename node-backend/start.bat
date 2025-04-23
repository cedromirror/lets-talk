@echo off
echo Starting Instagram Backend with PM2...
call npm install -g pm2
call pm2 start ecosystem.config.js
echo.
echo Backend started! Use the following commands:
echo - "pm2 logs instagram-backend" to view logs
echo - "pm2 stop instagram-backend" to stop the server
echo - "pm2 restart instagram-backend" to restart the server
echo - "pm2 delete instagram-backend" to remove the server from PM2
echo.
echo Press any key to exit...
pause > nul
