#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - DEBUGGING Installation                  ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ~/crumbpanel || exit 1

mkdir -p data/backups data/servers data/logs

echo -e "${YELLOW}Stopping everything...${NC}"
docker compose down -v 2>/dev/null || true

echo -e "${YELLOW}Building containers...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Starting database...${NC}"
docker compose up -d db

echo -e "${YELLOW}Waiting 15 seconds for database...${NC}"
sleep 15

echo -e "${YELLOW}Testing database...${NC}"
docker compose exec db mysql -u mc_admin -pmc_password mc_panel -e "SELECT 1"

echo -e "${YELLOW}Starting backend...${NC}"
docker compose up -d backend

echo -e "${YELLOW}Watching backend logs for 30 seconds...${NC}"
timeout 30 docker compose logs -f backend || true

echo -e "${YELLOW}Starting frontend...${NC}"
docker compose up -d frontend

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Container Status                                      ║"
echo "╚════════════════════════════════════════════════════════╝"
docker compose ps

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Backend Logs (last 30 lines)                         ║"
echo "╚════════════════════════════════════════════════════════╝"
docker compose logs backend --tail=30

echo ""
IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}Try: http://${IP}:8437${NC}"
echo ""
echo "View live logs: docker compose logs -f backend"
