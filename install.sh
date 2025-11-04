#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation Script                     ║"
echo "╚════════════════════════════════════════════════════════╝"

# Prüfe Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed!"
    exit 1
fi

# Stoppe und lösche ALLE alten CrumbPanel Container
echo "Cleaning up old installations..."
docker stop mc_backend mc_frontend mc_db 2>/dev/null || true
docker rm mc_backend mc_frontend mc_db 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true
docker volume rm crumbpanel_db_data 2>/dev/null || true
docker rmi crumbpanel_backend crumbpanel_frontend crumbpanel-backend crumbpanel-frontend 2>/dev/null || true

# Lösche altes Verzeichnis
if [ -d "crumbpanel" ]; then
    echo "Removing old directory..."
    rm -rf crumbpanel
fi

# Clone Repository
echo "Cloning repository..."
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Erstelle Ordner
echo "Creating directories..."
mkdir -p data/backups data/servers data/database

# Lösche alte Migrations
rm -rf backend/prisma/migrations 2>/dev/null || true

# Baue Container
echo ""
echo "Building containers (this takes a few minutes)..."
docker-compose build --no-cache

# Starte Services
echo ""
echo "Starting services..."
docker-compose up -d

# Warte
echo ""
echo "Waiting for services..."
sleep 20

# Status
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
IP=$(hostname -I | awk '{print $1}')
echo "Frontend: http://$IP:8437"
echo "Backend:  http://$IP:5829"
echo ""

docker-compose ps

echo ""
echo "Backend Logs:"
docker logs --tail 30 mc_backend

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "Commands: docker-compose logs -f | docker-compose down"
echo "╚════════════════════════════════════════════════════════╝"
