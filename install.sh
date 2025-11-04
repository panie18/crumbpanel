#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - MariaDB Installation                    ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Run from crumbpanel directory${NC}"
    exit 1
fi

mkdir -p data/backups data/servers data/logs

echo -e "${YELLOW}Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

echo -e "${YELLOW}Building containers...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Starting containers...${NC}"
docker compose up -d

echo -e "${YELLOW}Waiting 40 seconds for startup...${NC}"
sleep 40

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Access: http://${IP}:8437${NC}"
echo ""
docker compose ps
echo ""
echo "Check logs: docker compose logs -f"
