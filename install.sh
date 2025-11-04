#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation Script                     ║"
echo "╚════════════════════════════════════════════════════════╝"

# Clean old installations
docker stop mc_frontend mc_backend 2>/dev/null || true
docker rm mc_frontend mc_backend 2>/dev/null || true
docker rmi crumbpanel_frontend crumbpanel_backend 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true

# Remove old directory
if [ -d "crumbpanel" ]; then
    rm -rf crumbpanel
fi

# Clone fresh repo
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Clean NestJS files
rm -rf backend/src/*
mkdir -p backend/src

# Create data dirs
mkdir -p data/{backups,servers,database}

# Build and start
docker-compose build --no-cache
docker-compose up -d

echo "Installation complete!"
docker-compose ps
