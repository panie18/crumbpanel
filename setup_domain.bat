@echo off
echo Setting up crumbpanel.local...

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Adding entry to Hosts file...
    echo. >> "%WINDIR%\System32\drivers\etc\hosts"
    echo 127.0.0.1 crumbpanel.local >> "%WINDIR%\System32\drivers\etc\hosts"
    echo.
    echo Success! You can now access the panel at http://crumbpanel.local
) else (
    echo.
    echo ERROR: Please run this script as Administrator!
    echo (Right-click this file and select 'Run as Administrator')
    echo.
)
pause
