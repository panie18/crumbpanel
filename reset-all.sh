#!/bin/bash

echo "💥 NUCLEAR RESET - ALLES LÖSCHEN!"
echo "================================="
echo ""

# Kill alles
echo "🔪 Killing all containers..."
docker kill $(docker ps -q) 2>/dev/null || echo "No containers to kill"

# Stop compose
echo "🛑 Stopping docker compose..."
docker compose down --remove-orphans --volumes 2>/dev/null || echo "Nothing to stop"

# Remove ALLES
echo "🗑️ REMOVING EVERYTHING..."
sudo rm -rf data/ || echo "No data to remove"
sudo rm -rf minecraft-servers/ || echo "No servers to remove" 
sudo rm -rf backups/ || echo "No backups to remove"
sudo rm -rf node_modules/ || echo "No node_modules"

# Clean Docker komplett
echo "🧹 CLEANING DOCKER..."
docker system prune -a -f --volumes
docker builder prune -a -f
docker network prune -f
docker volume prune -f

# Remove images
echo "🖼️ REMOVING IMAGES..."
docker rmi $(docker images -q) -f 2>/dev/null || echo "No images to remove"

# Create fresh dirs
echo "📁 Creating fresh directories..."
mkdir -p data
mkdir -p minecraft-servers
mkdir -p backups

# Fix permissions
echo "🔐 Fixing permissions..."
sudo chown -R $(whoami):$(whoami) .
sudo chmod -R 755 .

# Build everything fresh
echo "🔨 BUILDING FRESH..."
docker compose build --no-cache --pull

# Start
echo "🚀 STARTING FRESH..."
docker compose up -d

# Wait
echo "⏳ Waiting 30 seconds..."
sleep 30

# Show result
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ NUCLEAR RESET COMPLETE! ✅               ║"
echo "║              EVERYTHING WAS DELETED!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo "🌐 Go to: http://$IP:8437"
echo "📋 Status:"
docker compose ps

echo ""
echo "🎯 This should now show SETUP WIZARD!"
