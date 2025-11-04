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

# Stop old
echo -e "${YELLOW}Stopping old containers...${NC}"
sudo docker-compose down -v 2>/dev/null || true

# Build
echo -e "${YELLOW}Building containers...${NC}"
sudo docker-compose build --no-cache

# Start database
echo -e "${YELLOW}Starting database...${NC}"
sudo docker-compose up -d db

# Wait for DB
echo -e "${YELLOW}Waiting for database...${NC}"
for i in {1..60}; do
  if sudo docker-compose exec -T db pg_isready -U mc_admin -d mc_panel > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database ready${NC}"
    break
  fi
  sleep 2
done

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
sudo docker-compose up -d backend

# Wait for backend
echo -e "${YELLOW}Waiting for backend...${NC}"
for i in {1..90}; do
  if curl -s http://localhost:5829/api/auth/setup-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 90 ]; then
    echo -e "${RED}Backend failed. Showing logs:${NC}"
    sudo docker-compose logs backend
    exit 1
  fi
  sleep 2
done

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
sudo docker-compose up -d frontend

sleep 5

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALLATION COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access: http://${IP}:8437${NC}"
echo -e "${GREEN}🌐 Local:  http://localhost:8437${NC}"
echo ""
sudo docker-compose ps
