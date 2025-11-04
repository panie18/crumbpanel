#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - CLEAN BUILD Installation                ║"
echo "╚════════════════════════════════════════════════════════╝"

cd ~/crumbpanel || exit 1

# Clean backend
echo "🧹 Cleaning backend..."
rm -rf backend/node_modules backend/dist
rm -rf backend/src/audit backend/src/cloud-backup backend/src/files 
rm -rf backend/src/metrics backend/src/players backend/src/websocket
rm -rf backend/src/auth/dto backend/src/auth/guards backend/src/auth/strategies
rm -rf backend/src/servers/dto
rm -f backend/src/servers/rcon.service.ts
rm -f backend/src/index.ts

mkdir -p data/backups data/servers data/logs

echo "🛑 Stopping old containers..."
docker compose down -v 2>/dev/null || true

echo "🔨 Building clean backend..."
docker compose build --no-cache backend

echo "🎨 Building frontend..."
docker compose build --no-cache frontend

echo "🚀 Starting containers..."
docker compose up -d

echo "⏳ Waiting 30 seconds..."
sleep 30

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ CLEAN INSTALLATION COMPLETE!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access: http://${IP}:8437"
echo ""
echo "Container Status:"
docker compose ps
echo ""
echo "Backend Logs:"
docker compose logs backend --tail=10
