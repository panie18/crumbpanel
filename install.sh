#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Simple Installation                     ║"
echo "╚════════════════════════════════════════════════════════╝"

# Cleanup
echo "Cleaning up..."
docker stop mc_backend mc_frontend 2>/dev/null || true
docker rm mc_backend mc_frontend 2>/dev/null || true
docker network rm crumbpanel_crumbpanel 2>/dev/null || true
docker rmi crumbpanel_backend crumbpanel_frontend 2>/dev/null || true

if [ -d "crumbpanel" ]; then
    rm -rf crumbpanel
fi

# Clone
echo "Cloning..."
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Build
echo "Building..."
docker-compose build --no-cache

# Start
echo "Starting..."
docker-compose up -d

sleep 15

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  DONE!                                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Frontend: http://$(hostname -I | awk '{print $1}'):8437"
echo ""
docker-compose ps
docker logs --tail 20 mc_backend
