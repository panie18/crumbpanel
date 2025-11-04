#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - NETWORK HOST MODE Installation          ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Run from crumbpanel directory${NC}"
    exit 1
fi

# Create .env
if [ ! -f ".env" ]; then
    cat > .env << EOF
POSTGRES_USER=mc_admin
POSTGRES_PASSWORD=mc_password
POSTGRES_DB=mc_panel
DATABASE_URL=postgresql://mc_admin:mc_password@localhost:5432/mc_panel
JWT_SECRET=crumbpanel_jwt_secret_min32chars_long
JWT_REFRESH_SECRET=crumbpanel_refresh_secret_min32chars
ENCRYPTION_KEY=crumbpanel_encryption_key_16ch
PORT=5829
EOF
fi

mkdir -p data/backups data/servers data/logs

echo -e "${YELLOW}Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

echo -e "${YELLOW}Building containers...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Starting all containers...${NC}"
docker compose up -d

echo -e "${YELLOW}Waiting 30 seconds for startup...${NC}"
sleep 30

echo ""
echo "=== DIAGNOSTIC INFO ==="
echo ""
echo "Container Status:"
docker compose ps
echo ""
echo "Listening Ports:"
netstat -tlnp | grep -E ':(5432|5829|8437)' || echo "No CrumbPanel ports found"
echo ""

# Test backend
echo -e "${YELLOW}Testing backend...${NC}"
if curl -s http://localhost:5829/api/auth/setup-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend responding${NC}"
else
    echo -e "${RED}✗ Backend not responding. Logs:${NC}"
    docker compose logs backend | tail -20
fi

# Test frontend
echo -e "${YELLOW}Testing frontend...${NC}"
if curl -s http://localhost:8437 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend responding${NC}"
else
    echo -e "${RED}✗ Frontend not responding. Logs:${NC}"
    docker compose logs frontend | tail -20
fi

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Try accessing:${NC}"
echo "  http://${IP}:8437"
echo "  http://localhost:8437"
echo ""
echo "If still not working, run:"
echo "  docker compose logs backend"
echo "  docker compose logs frontend"
