#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation Script                     ║"
echo "╚════════════════════════════════════════════════════════╝"

# Check dependencies
if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command -v git >/dev/null 2>&1; then
    echo "Error: Git is not installed"
    exit 1
fi

# Stop and remove old containers
echo "Cleaning up old installation..."
docker stop mc_frontend mc_backend 2>/dev/null || true
docker rm mc_frontend mc_backend 2>/dev/null || true
docker rmi crumbpanel_frontend crumbpanel_backend 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true

# Remove old directory if exists
if [ -d "crumbpanel" ]; then
    echo "Removing old crumbpanel directory..."
    rm -rf crumbpanel
fi

# Clone fresh repository
echo "Cloning repository..."
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Create data directories
echo "Creating data directories..."
mkdir -p data/{backups,servers,database}

# Build and start
echo "Building containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

# Wait for startup
echo "Waiting for services to start..."
sleep 10

# Show status
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
IP=$(hostname -I | awk '{print $1}')
echo "Frontend URL: http://$IP:8437"
echo "Backend URL:  http://$IP:5829"
echo ""
echo "Container Status:"
docker-compose ps
echo ""
echo "Backend Logs:"
docker logs mc_backend --tail 20
