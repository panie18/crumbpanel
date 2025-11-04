#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - SIMPLIFIED Installation                 ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Run this from the crumbpanel directory.${NC}"
    exit 1
fi

# Create .env if missing
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
POSTGRES_USER=mc_admin
POSTGRES_PASSWORD=mc_password
POSTGRES_DB=mc_panel
DATABASE_URL=postgresql://mc_admin:mc_password@db:5432/mc_panel
JWT_SECRET=crumbpanel_jwt_secret_min32chars_long
JWT_REFRESH_SECRET=crumbpanel_refresh_secret_min32chars
ENCRYPTION_KEY=crumbpanel_encryption_key_16ch
PORT=5829
EOF
fi

# Create directories
mkdir -p data/backups data/servers data/logs

# Stop old containers
echo -e "${YELLOW}Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

# Build and start ALL containers
echo -e "${YELLOW}Building and starting all containers...${NC}"
docker compose up -d --build

# Wait for backend
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..120}; do
  if curl -s http://localhost:5829/api/auth/setup-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 120 ]; then
    echo -e "${RED}Backend failed. Container status:${NC}"
    docker compose ps
    echo -e "${RED}Backend logs:${NC}"
    docker compose logs backend
    exit 1
  fi
  sleep 2
done

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:8437 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Frontend failed. Container status:${NC}"
    docker compose ps
    echo -e "${RED}Frontend logs:${NC}"
    docker compose logs frontend
    exit 1
  fi
  sleep 2
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
docker compose ps
