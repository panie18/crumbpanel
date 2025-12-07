#!/bin/bash

echo "🎮 CRUMBPANEL AUTO INSTALLER"
echo "============================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git not found! Installing git..."
    sudo apt update && sudo apt install -y git
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
INSTALL_DIR="$HOME/crumbpanel"

echo "📍 Current directory: $CURRENT_DIR"
echo "📍 Install directory: $INSTALL_DIR"
echo ""

# Remove existing crumbpanel directory
if [ -d "$INSTALL_DIR" ]; then
    echo "🗑️ Removing existing CrumbPanel installation..."
    sudo rm -rf "$INSTALL_DIR"
fi

# Clone the repository
echo "📥 Cloning CrumbPanel repository..."
git clone https://github.com/panie18/crumbpanel.git "$INSTALL_DIR"

# Change to the installation directory
cd "$INSTALL_DIR"
echo "📁 Changed to: $(pwd)"
echo ""

# ⚠️ NEU: Alte fehlerhafte Dateien löschen
echo "🧹 CLEANING OLD BROKEN FILES..."
rm -rf backend/src/server/ 2>/dev/null || true
rm -rf backend/src/audit/ 2>/dev/null || true
rm -rf backend/src/cloud-backup/ 2>/dev/null || true
rm -rf backend/src/files/ 2>/dev/null || true
rm -rf backend/src/metrics/ 2>/dev/null || true
rm -rf backend/src/players/ 2>/dev/null || true
rm -rf backend/src/websocket/ 2>/dev/null || true
echo "✅ Cleanup complete"
echo ""

echo "🚨 This will DELETE ALL DATA and install fresh!"
echo ""

# Auto Fresh Install
echo "💥 STOPPING CONTAINERS..."
docker compose down --remove-orphans 2>/dev/null || true

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
echo "║            ✅ INSTALLATION COMPLETE! ✅                ║"
echo "║         Repository cloned to: $INSTALL_DIR              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 ACCESS CRUMBPANEL:"
echo "   👉 http://$IP:8437"
echo "   👉 http://localhost:8437"
echo ""
echo "📁 FILES LOCATION:"
echo "   👉 cd $INSTALL_DIR"
echo ""
echo "🔧 USEFUL COMMANDS:"
echo "   👉 cd $INSTALL_DIR && docker compose logs -f"
echo "   👉 cd $INSTALL_DIR && docker compose restart"
echo ""
echo "🎯 NEXT: Complete the setup wizard!"
echo ""
echo "⭐ GITHUB: https://github.com/panie18/crumbpanel"
echo "💝 MADE BY: https://paulify.eu"
echo ""

# Show container status
echo "📋 CONTAINER STATUS:"
docker compose ps
