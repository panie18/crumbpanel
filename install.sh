#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation                             ║"
echo "╚════════════════════════════════════════════════════════╝"

echo "Stopping old containers..."
docker-compose down -v 2>/dev/null

echo "Removing old images..."
docker rmi crumbpanel_backend crumbpanel_frontend crumbpanel-backend crumbpanel-frontend 2>/dev/null

echo "Creating directories..."
mkdir -p data/backups data/servers

echo "Cleaning old migrations..."
rm -rf backend/prisma/migrations 2>/dev/null

echo ""
echo "Building and starting all services..."
docker-compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 15

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Access your panel at:"
echo "  Frontend: http://localhost:8437"
echo "  Backend:  http://localhost:5829"
echo ""

echo "Container Status:"
docker-compose ps

echo ""
echo "Backend Logs (last 30 lines):"
docker logs --tail 30 mc_backend

echo ""
echo "Setup complete! Press Ctrl+C to exit, or wait to see live logs..."
sleep 3
docker-compose logs -f
