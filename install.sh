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
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Frontend: http://localhost:8437"
echo "Backend:  http://localhost:5829"
echo ""
echo "Container Status:"
docker-compose ps
echo ""
echo "Logs (Ctrl+C to exit):"
docker-compose logs -f
