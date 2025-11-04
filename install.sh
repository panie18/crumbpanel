#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Guaranteed Working Installation         ║"
echo "╚════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo apt-get update && sudo apt-get install -y docker-compose
fi

# Clone repo
cd ~
if [ -d "crumbpanel" ]; then
    cd crumbpanel
    git pull
else
    git clone https://github.com/panie18/crumbpanel.git
    cd crumbpanel
fi

# Create directories
mkdir -p data/backups data/servers data/logs

# Force docker compose to run from the correct directory and show helpful diagnostics if something fails.
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Always use the compose file from the project root
DC="docker compose -f \"$ROOT_DIR/docker-compose.yml\""

# Stop old
echo -e "${YELLOW}Stopping old containers...${NC}"
eval $DC down -v 2>/dev/null || true

# Build
echo -e "${YELLOW}Building containers...${NC}"
eval $DC build --no-cache

# Start database
echo -e "${YELLOW}Starting database...${NC}"
eval $DC up -d db

# Wait for DB
echo -e "${YELLOW}Waiting for database...${NC}"
for i in {1..60}; do
  if eval $DC exec -T db pg_isready -U ${POSTGRES_USER:-mc_admin} -d ${POSTGRES_DB:-mc_panel} >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Database ready${NC}"
    break
  fi
  sleep 2
done

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
eval $DC up -d backend

# Wait for backend
echo -e "${YELLOW}Waiting for backend...${NC}"
for i in {1..90}; do
  if curl -s http://localhost:5829/api/auth/setup-status >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 90 ]; then
    echo -e "${RED}Backend failed to start. Showing logs:${NC}"
    eval $DC logs backend
    exit 1
  fi
  sleep 2
done

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
eval $DC up -d frontend

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8437 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Frontend failed to start. Showing logs:${NC}"
    eval $DC logs frontend
    exit 1
  fi
  sleep 1
done

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALLATION COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access: http://${IP}:8437${NC}"
echo -e "${GREEN}🌐 Local:  http://localhost:8437${NC}"
echo ""
eval $DC ps
