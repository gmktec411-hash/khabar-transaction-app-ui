@echo off
echo ============================================
echo Transaction App - Network Setup Helper
echo ============================================
echo.

:: Get the server's IP address
echo Finding your server IP address...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Found IP: !IP!
)

echo.
echo ============================================
echo Current .env Configuration:
echo ============================================
type .env 2>nul
if errorlevel 1 (
    echo .env file not found. Creating from template...
    copy .env.example .env
)

echo.
echo ============================================
echo Quick Setup Options:
echo ============================================
echo 1. Setup for LOCAL use only (localhost)
echo 2. Setup for NETWORK access (other machines)
echo 3. Manual setup (edit .env file yourself)
echo 4. Show my IP address
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Setting up for LOCAL use...
    echo REACT_APP_API_BASE_URL=http://localhost:8848/api > .env
    echo REACT_APP_OUTLOOK_API_BASE_URL=http://localhost:8080 >> .env
    echo REACT_APP_API_TRANSACTION_PATH=/transactions/getAllTransactionsByAdmin >> .env
    echo.
    echo Configuration saved! App will only work on this machine.
    echo.
    echo IMPORTANT: Restart the app with: npm start
)

if "%choice%"=="2" (
    echo.
    set /p serverip="Enter your server IP address (or press Enter to auto-detect): "

    if "!serverip!"=="" (
        for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
            set serverip=%%a
            set serverip=!serverip:~1!
        )
    )

    echo.
    echo Setting up for NETWORK access with IP: !serverip!
    echo REACT_APP_API_BASE_URL=http://!serverip!:8848/api > .env
    echo REACT_APP_OUTLOOK_API_BASE_URL=http://!serverip!:8080 >> .env
    echo REACT_APP_API_TRANSACTION_PATH=/transactions/getAllTransactionsByAdmin >> .env
    echo.
    echo Configuration saved!
    echo.
    echo Access the app from other machines at: http://!serverip!:3000
    echo.
    echo IMPORTANT:
    echo 1. Restart the app with: npm start
    echo 2. Make sure firewall allows ports 8848, 8080, 3000
    echo 3. Backend servers must be configured to accept external connections
)

if "%choice%"=="3" (
    echo.
    echo Opening .env file for manual editing...
    notepad .env
    echo.
    echo After editing, restart the app with: npm start
)

if "%choice%"=="4" (
    echo.
    echo Your IP addresses:
    ipconfig | findstr /c:"IPv4 Address"
    echo.
    pause
    goto :start
)

echo.
echo ============================================
echo Next Steps:
echo ============================================
echo 1. Make sure backend servers are running (ports 8848 and 8080)
echo 2. Restart the React app: npm start
echo 3. Check NETWORK_SETUP.md for detailed instructions
echo.
pause
