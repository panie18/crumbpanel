#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Fresh Install (SQLite)                  ║"
echo "╚════════════════════════════════════════════════════════╝"

# Stop and remove old containers
echo "Cleaning up old containers..."
docker stop mc_frontend mc_backend 2>/dev/null || true
docker rm mc_frontend mc_backend 2>/dev/null || true
docker rmi crumbpanel_frontend crumbpanel_backend 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true

# Clean backend build artifacts
echo "Cleaning build artifacts..."
rm -rf backend/dist
rm -rf backend/node_modules
rm -rf backend/src/node_modules

# Ensure data directories exist
echo "Creating data directories..."
mkdir -p data/backups data/servers data/database

# Build fresh
echo "Building containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

# Wait a bit
echo "Waiting for services to start..."
sleep 5

# Show status
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
docker logs mc_backend --tail 20
