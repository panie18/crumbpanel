#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation with Diagnostics           ║"
echo "╚════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if in correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found. Run this from the crumbpanel directory.${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${RED}Please log out and log back in, then run this script again.${NC}"
    exit 0
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo apt-get update && sudo apt-get install -y docker-compose
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
    echo -e "${GREEN}✓ .env created${NC}"
fi

# Create directories
mkdir -p data/backups data/servers data/logs

# Stop old containers
echo -e "${YELLOW}Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

# Build
echo -e "${YELLOW}Building containers...${NC}"
docker compose build --no-cache

# Start database
echo -e "${YELLOW}Starting database...${NC}"
docker compose up -d db

# Wait for DB
echo -e "${YELLOW}Waiting for database...${NC}"
for i in {1..60}; do
  if docker compose exec -T db pg_isready -U mc_admin -d mc_panel > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Database failed to start. Logs:${NC}"
    docker compose logs db
    exit 1
  fi
  sleep 2
done

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
docker compose up -d backend

# Wait for backend
echo -e "${YELLOW}Waiting for backend...${NC}"
for i in {1..90}; do
  if curl -s http://localhost:5829/api/auth/setup-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 90 ]; then
    echo -e "${RED}Backend failed to start. Logs:${NC}"
    docker compose logs backend
    exit 1
  fi
  sleep 2
done

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
docker compose up -d frontend

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8437 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Frontend failed to start. Logs:${NC}"
    docker compose logs frontend
    exit 1
  fi
  sleep 1
done

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALLATION COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access: http://${IP}:8437${NC}"
echo -e "${GREEN}🌐 Local:  http://localhost:8437${NC}"
echo ""
echo "Container Status:"
docker compose ps
echo ""
echo -e "${BLUE}📋 View logs: docker compose logs -f${NC}"
echo -e "${BLUE}🛑 Stop:      docker compose stop${NC}"
echo -e "${BLUE}🚀 Start:     docker compose start${NC}"
