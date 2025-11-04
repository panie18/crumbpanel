@echo off
echo ========================================================
echo  CrumbPanel - Windows Installation
echo ========================================================

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed! Please install Docker Desktop first:
    echo https://www.docker.com/products/docker-desktop
    echo.
    echo After installing Docker Desktop, also ensure WSL2 is installed:
    echo wsl --install
    pause
    exit /b 1
)

REM Clean old containers
echo Cleaning up old containers...
docker stop mc_frontend mc_backend 2>nul
docker rm mc_frontend mc_backend 2>nul
docker rmi crumbpanel_frontend crumbpanel_backend 2>nul
docker network rm crumbpanel_crumbpanel 2>nul

REM Create directories
echo Creating data directories...
mkdir data\backups 2>nul
mkdir data\servers 2>nul
mkdir data\database 2>nul

REM Build and start
echo Building containers...
docker-compose build --no-cache

echo Starting services...
docker-compose up -d

echo.
echo ========================================================
echo Installation complete!
echo.
echo Frontend: http://localhost:8437
echo Backend:  http://localhost:5829
echo.
docker-compose ps
echo.
echo Backend logs:
docker logs mc_backend --tail 20
pause
