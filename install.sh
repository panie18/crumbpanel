#!/bin/bash

echo "🎮 CRUMBPANEL AUTO INSTALLER"
echo "============================"
echo ""
echo "🚨 This will DELETE ALL DATA and install fresh!"
echo ""

# Auto Fresh Install - NO MENU!
echo "💥 STOPPING CONTAINERS..."
docker compose down --remove-orphans 2>/dev/null

echo "🗑️ DELETING ALL DATA..."
sudo rm -rf data/
sudo rm -rf minecraft-servers/
sudo rm -rf backups/

echo "🧹 CLEANING DOCKER..."
docker system prune -f
docker volume prune -f

echo "📁 CREATING DIRECTORIES..."
mkdir -p data
mkdir -p minecraft-servers
mkdir -p backups

echo "🔐 FIXING PERMISSIONS..."
sudo chown -R $(whoami):$(whoami) .

echo "🔨 BUILDING FRESH CONTAINERS..."
docker compose build --no-cache

echo "🚀 STARTING SERVICES..."
docker compose up -d

echo "⏳ WAITING FOR SERVICES..."
sleep 30

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ FRESH INSTALL COMPLETE! ✅               ║"
echo "║              ALL DATA WAS DELETED!                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 ACCESS CRUMBPANEL:"
echo "   👉 http://$IP:8437"
echo "   👉 http://localhost:8437"
echo ""
echo "🎯 NEXT: Complete the setup wizard!"
echo ""
echo "⭐ GITHUB: https://github.com/panie18/crumbpanel"
echo "💝 MADE BY: https://paulify.eu"
echo ""

# Show container status
echo "📋 CONTAINER STATUS:"
docker compose ps
