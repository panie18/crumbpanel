#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - SQLite + Auth0 Installation             ║"
echo "╚════════════════════════════════════════════════════════╝"

cd ~/crumbpanel || exit 1

mkdir -p data/backups data/servers data/logs

echo "Stopping old containers..."
docker compose down -v 2>/dev/null || true

echo "Building containers..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Waiting 20 seconds..."
sleep 20

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALLATION COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access: http://${IP}:8437"
echo ""
echo "⚠️  Configure Auth0:"
echo "   1. Create Auth0 app at https://manage.auth0.com"
echo "   2. Set callback URL: http://${IP}:8437/api/auth/callback"
echo "   3. Update docker-compose.yml with your Auth0 credentials"
echo ""
docker compose ps
