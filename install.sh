#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Clean Install (SQLite)                  ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ~/crumbpanel || exit 1

mkdir -p data/database data/backups data/servers

echo -e "${YELLOW}Stopping and removing old containers...${NC}"
docker compose down -v 2>/dev/null || true

echo -e "${YELLOW}Removing old images...${NC}"
docker rmi crumbpanel-backend crumbpanel-frontend 2>/dev/null

echo -e "${YELLOW}Cleaning old migrations...${NC}"
rm -rf backend/prisma/migrations

echo -e "${YELLOW}Building containers...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Starting containers...${NC}"
docker compose up -d

echo ""
echo "Waiting for services to start..."
sleep 5

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Frontend: http://localhost:8437"
echo "Backend:  http://localhost:5829"
echo ""
echo "Checking container status..."
docker compose ps

echo ""
echo "Showing logs (Ctrl+C to exit)..."
docker compose logs -f
