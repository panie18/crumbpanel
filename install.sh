#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          CrumbPanel - GUARANTEED WORKING INSTALL          ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Docker check
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}Installing Docker Compose...${NC}"
  sudo apt-get update && sudo apt-get install -y docker-compose
fi

# Clone or update
REPO_DIR="crumbpanel"
if [ ! -d "$REPO_DIR" ]; then
  git clone https://github.com/panie18/crumbpanel.git $REPO_DIR
  cd $REPO_DIR
else
  cd $REPO_DIR
  git pull
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cp .env.example .env
  
  # Generate secure random values
  sed -i "s/secure_password_change_me/$(openssl rand -base64 32)/g" .env
  sed -i "s/change_me_min_32_characters_long_secret_key/$(openssl rand -hex 32)/g" .env
  sed -i "s/change_me_min_32_characters_long_refresh_secret/$(openssl rand -hex 32)/g" .env
  sed -i "s/change_me_exactly_32_chars_key!!/$(openssl rand -hex 16)/g" .env
  
  echo -e "${GREEN}✓ .env created with secure random values${NC}"
fi

# Create directories
mkdir -p data/backups data/servers data/logs
chmod -R 755 data

# Stop and remove old containers
echo -e "${YELLOW}Cleaning up old containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Build everything
echo -e "${YELLOW}Building containers...${NC}"
docker-compose build --no-cache

# Start database only
echo -e "${YELLOW}Starting database...${NC}"
docker-compose up -d db

# Wait for DB
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
for i in {1..60}; do
  if docker-compose exec -T db pg_isready -U mc_admin > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Database failed to start!${NC}"
    docker-compose logs db
    exit 1
  fi
  sleep 1
done

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
docker-compose up -d backend

# Wait for backend
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..90}; do
  if curl -s http://localhost:5829/api/auth/setup-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready${NC}"
    break
  fi
  if [ $i -eq 90 ]; then
    echo -e "${RED}Backend failed to start!${NC}"
    echo "Backend logs:"
    docker-compose logs backend
    exit 1
  fi
  sleep 2
done

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
docker-compose up -d frontend

sleep 5

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            ✅ INSTALLATION SUCCESSFUL! ✅                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Open: http://localhost:8437${NC}"
echo ""
docker-compose ps
echo ""
echo -e "${BLUE}📋 To view logs: docker-compose logs -f${NC}"
