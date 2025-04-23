@echo off
echo Testing Instagram Clone Backend Connection...
echo.

node test-backend-connection.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo All connection tests passed!
) else (
  echo Some connection tests failed. Please check the output above for details.
)

echo.
echo Press any key to exit...
pause > nul
