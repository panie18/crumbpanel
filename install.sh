#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - PostgreSQL Installation                 ║"
echo "╚════════════════════════════════════════════════════════╝"

echo "Stopping old containers..."
docker-compose down -v

echo "Removing old images..."
docker rmi crumbpanel-backend crumbpanel-frontend 2>/dev/null

echo "Creating directories..."
mkdir -p data/backups data/servers

echo "Cleaning migrations..."
rm -rf backend/prisma/migrations

echo "Building containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for backend to start..."
sleep 10

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Checking Backend Logs                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
docker logs mc_backend

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Container Status                                      ║"
echo "╚════════════════════════════════════════════════════════╝"
docker-compose ps

echo ""
echo "Frontend: http://localhost:8437"
echo "Backend:  http://localhost:5829"
echo ""
echo "If backend failed, run: docker logs mc_backend"
echo ""
read -p "Show live logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker-compose logs -f
fi
