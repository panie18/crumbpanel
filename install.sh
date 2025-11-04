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

echo "Cleaning migrations..."
rm -rf backend/prisma/migrations 2>/dev/null

echo "Building and starting services..."
docker-compose up -d --build

echo ""
echo "Waiting for services to start (30 seconds)..."
sleep 30

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
echo "Backend Logs:"
docker logs --tail 50 mc_backend
echo ""
echo "Frontend Logs:"
docker logs --tail 20 mc_frontend
