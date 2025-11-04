#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - CLEAN TypeORM Installation              ║"
echo "║          Made by paulify.dev (https://paulify.eu)     ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Install Git if needed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    sudo apt-get update && sudo apt-get install -y git
fi

# Install Docker if needed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Please log out and log back in, then run this script again${NC}"
    exit 0
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    sudo apt-get update && sudo apt-get install -y docker-compose
fi

# Clone or update repository
REPO_DIR="crumbpanel"
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${YELLOW}📥 Cloning CrumbPanel repository...${NC}"
    git clone https://github.com/panie18/crumbpanel.git $REPO_DIR
    cd $REPO_DIR
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Repository already exists${NC}"
    cd $REPO_DIR
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull
fi

# AGGRESSIVE CLEANUP - Remove ALL broken files
echo -e "${YELLOW}🧹 Removing ALL broken backend files...${NC}"
rm -rf backend/src/audit
rm -rf backend/src/cloud-backup  
rm -rf backend/src/files
rm -rf backend/src/metrics
rm -rf backend/src/players
rm -rf backend/src/websocket
rm -rf backend/src/prisma
rm -rf backend/prisma
rm -f backend/src/auth/dto
rm -f backend/src/auth/guards
rm -f backend/src/auth/strategies
rm -f backend/src/servers/dto
rm -f backend/src/servers/rcon.service.ts
rm -f backend/src/index.ts

# Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p data/backups data/servers data/logs
chmod -R 755 data

# Remove old Prisma files if they exist
echo -e "${YELLOW}🧹 Cleaning up old files...${NC}"
rm -rf backend/prisma backend/node_modules backend/dist 2>/dev/null || true
rm -rf frontend/node_modules frontend/dist 2>/dev/null || true

# Stop old containers
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

# Remove old images to force rebuild
echo -e "${YELLOW}🗑️ Removing old images...${NC}"
docker image rm crumbpanel-backend crumbpanel-frontend 2>/dev/null || true

# Build fresh containers
echo -e "${YELLOW}🔨 Building containers (this may take a few minutes)...${NC}"
docker compose build --no-cache

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker compose up -d

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:5829/api/auth/me > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Backend failed to start. Logs:${NC}"
    docker compose logs backend
    exit 1
  fi
  echo "Waiting... ($i/60)"
  sleep 2
done

# Wait for frontend
echo -e "${YELLOW}⏳ Waiting for frontend...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8437 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Frontend failed to start. Logs:${NC}"
    docker compose logs frontend
    exit 1
  fi
  sleep 1
done

# Get server IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ INSTALLATION COMPLETE! ✅                ║"
echo "║          Made by paulify.dev (https://paulify.eu)     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 Access CrumbPanel:${NC}"
echo -e "   Local:    http://localhost:8437"
echo -e "   Network:  http://${IP}:8437"
echo ""
echo -e "${GREEN}🔧 Backend API:${NC}"
echo -e "   URL:      http://localhost:5829/api"
echo ""
echo -e "${GREEN}💾 Database:${NC}"
echo -e "   Type:     SQLite"
echo -e "   Location: ./data/crumbpanel.db"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Container Status:"
docker compose ps
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "   View logs:     docker compose logs -f"
echo "   Stop:          docker compose stop"
echo "   Start:         docker compose start"
echo "   Restart:       docker compose restart"
echo "   Update:        git pull && ./install.sh"
echo ""
echo -e "${YELLOW}🔐 Auth0 Setup Required:${NC}"
echo "   1. Create Auth0 app at https://manage.auth0.com"
echo "   2. Set callback URL: http://${IP}:8437/api/auth/callback"
echo "   3. Update docker-compose.yml with your Auth0 credentials"
echo ""
echo -e "${GREEN}⭐ Star the project: ${BLUE}https://github.com/panie18/crumbpanel${NC}"
echo -e "${GREEN}🌐 Visit: ${BLUE}https://paulify.eu${NC}"
echo ""
