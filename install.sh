#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              CrumbPanel - Installation                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}Please do not run as root${NC}"
  exit 1
fi

# Docker check
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo -e "${GREEN}✓ Docker installed${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}Installing Docker Compose...${NC}"
  sudo apt-get update && sudo apt-get install -y docker-compose
  echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Check Docker group
if ! groups $USER | grep -q '\bdocker\b'; then
  echo -e "${YELLOW}Adding user to docker group...${NC}"
  sudo usermod -aG docker $USER
  echo -e "${RED}Please log out and log back in, then run this script again${NC}"
  exit 0
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

# Create .env
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cp .env.example .env
  
  # Generate secure values
  POSTGRES_PASS=$(openssl rand -base64 32)
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH=$(openssl rand -hex 32)
  ENCRYPT_KEY=$(openssl rand -hex 16)
  
  sed -i "s/secure_password_change_me/$POSTGRES_PASS/g" .env
  sed -i "s/change_me_min_32_characters_long_secret_key/$JWT_SECRET/g" .env
  sed -i "s/change_me_min_32_characters_long_refresh_secret/$JWT_REFRESH/g" .env
  sed -i "s/change_me_exactly_32_chars_key!!/$ENCRYPT_KEY/g" .env
  
  echo -e "${GREEN}✓ .env created${NC}"
fi

# Create directories
mkdir -p data/{backups,servers,logs}
chmod -R 755 data

# Stop old containers
echo -e "${YELLOW}Stopping old containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Check if ports are free
for port in 5432 5829 8437; do
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}Port $port is already in use!${NC}"
    echo "Please stop the service using this port and try again"
    exit 1
  fi
done

# Build
echo -e "${YELLOW}Building containers (this may take a while)...${NC}"
docker-compose build --no-cache

# Start database
echo -e "${YELLOW}Starting database...${NC}"
docker-compose up -d db

# Wait for DB
echo -e "${YELLOW}Waiting for database...${NC}"
for i in {1..60}; do
  if docker-compose exec -T db pg_isready -U mc_admin >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Database ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Database failed to start${NC}"
    docker-compose logs db
    exit 1
  fi
  sleep 1
done

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
docker-compose up -d backend

# Wait for backend
echo -e "${YELLOW}Waiting for backend...${NC}"
for i in {1..90}; do
  if curl -s http://localhost:5829/api/auth/setup-status >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 90 ]; then
    echo -e "${RED}Backend failed to start${NC}"
    docker-compose logs backend
    exit 1
  fi
  sleep 2
done

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
docker-compose up -d frontend

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8437 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Frontend failed to start${NC}"
    docker-compose logs frontend
    exit 1
  fi
  sleep 1
done

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            ✅ INSTALLATION SUCCESSFUL! ✅                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access CrumbPanel:${NC}"
echo -e "   Local:    http://localhost:8437"
echo -e "   Network:  http://${LOCAL_IP}:8437"
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose ps
echo ""
echo -e "${BLUE}📋 View logs:${NC} docker-compose logs -f"
echo -e "${BLUE}🛑 Stop:${NC}      docker-compose stop"
echo -e "${BLUE}🚀 Start:${NC}     docker-compose start"
echo ""
