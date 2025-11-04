#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Fresh Install (SQLite)                  ║"
echo "╚════════════════════════════════════════════════════════╝"

# Clean old run
echo "Cleaning old containers/images..."
docker stop mc_backend mc_frontend 2>/dev/null || true
docker rm mc_backend mc_frontend 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true
docker rmi crumbpanel_backend crumbpanel-frontend crumbpanel_frontend crumbpanel-backend 2>/dev/null || true

# Clone fresh repo
if [ -d "crumbpanel" ]; then rm -rf crumbpanel; fi
echo "Cloning repository..."
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Ensure data dirs
mkdir -p data/backups data/servers data/database

echo "Building containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

echo "Waiting for backend..."
sleep 10

echo "Containers:"
docker-compose ps

IP=$(hostname -I | awk '{print $1}')
echo "Frontend: http://$IP:8437"
echo "Backend:  http://$IP:5829"

echo "Backend logs (tail):"
docker logs --tail 50 mc_backend || true
