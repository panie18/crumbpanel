#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              CrumbPanel - Auto Installer                 ║"
echo "║          Made by paulify.dev (https://paulify.eu)        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "This script will install CrumbPanel on your system."
echo "Installation includes: Docker, Docker Compose, and all dependencies."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}⚠️  Please do not run as root. Run as normal user with sudo privileges.${NC}"
  exit 1
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo -e "${GREEN}✓ Docker installed${NC}"
else
  echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Check Docker Compose installation
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
  sudo apt-get update && sudo apt-get install -y docker-compose
  echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Clone repository if not exists
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

# Create .env file
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}🔐 Generating secure configuration...${NC}"
  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  DB_PASSWORD=$(openssl rand -base64 32)
  
  cat <<EOF > .env
# CrumbPanel Configuration
# Made by paulify.dev (https://paulify.eu)

# Database
POSTGRES_USER=mc_admin
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=mc_panel
DATABASE_URL=postgresql://mc_admin:$DB_PASSWORD@db:5432/mc_panel

# Backend
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$ENCRYPTION_KEY
PORT=5829

# Frontend
VITE_API_URL=http://localhost:5829
VITE_WS_URL=ws://localhost:5829

# Admin Account (created on first run)
ADMIN_EMAIL=admin@mcpanel.local
ADMIN_PASSWORD=admin123

# Optional: WebDAV Cloud Backup
# WEBDAV_URL=https://your-nextcloud.com/remote.php/dav/files/username/
# WEBDAV_USERNAME=your_username
# WEBDAV_PASSWORD=your_password
# WEBDAV_REMOTE_PATH=/minecraft-backups
EOF
  echo -e "${GREEN}✓ Configuration created with secure random secrets${NC}"
else
  echo -e "${GREEN}✓ Configuration file already exists${NC}"
fi

# Create data directories
echo -e "${YELLOW}📁 Creating data directories...${NC}"
mkdir -p data/backups data/servers data/logs
chmod -R 755 data
echo -e "${GREEN}✓ Directories created${NC}"

# Build and start Docker containers
echo -e "${YELLOW}🐳 Building Docker containers (this may take a few minutes)...${NC}"
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
echo -e "${GREEN}✓ Containers built${NC}"

echo -e "${YELLOW}🚀 Starting CrumbPanel...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 15

# Check if containers are running
if [ "$(docker-compose ps -q | wc -l)" -gt 0 ]; then
  echo -e "${GREEN}✓ All services started successfully${NC}"
else
  echo -e "${RED}✗ Error: Some services failed to start${NC}"
  echo -e "${YELLOW}Run 'docker-compose logs' for details${NC}"
  exit 1
fi

# Show status
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            🎉 Installation Complete! 🎉                   ║"
echo "║          Made by paulify.dev (https://paulify.eu)        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 Frontend:${NC}     http://localhost:8437"
echo -e "${GREEN}🔌 Backend API:${NC}  http://localhost:5829/api"
echo -e "${GREEN}💾 Database:${NC}     PostgreSQL on port 5432"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Default Login Credentials:${NC}"
echo "   Email:    admin@mcpanel.local"
echo "   Password: admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change the admin password after first login!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Container Status:"
docker-compose ps
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📚 Useful Commands:${NC}"
echo "   View logs:           docker-compose logs -f"
echo "   Stop panel:          docker-compose stop"
echo "   Start panel:         docker-compose start"
echo "   Restart panel:       docker-compose restart"
echo "   Update panel:        git pull && docker-compose up -d --build"
echo ""
echo -e "${YELLOW}💡 Tip: Configure WebDAV cloud backups in the Settings page!${NC}"
echo ""
echo -e "${GREEN}⭐ Star the project: ${BLUE}https://github.com/panie18/crumbpanel${NC}"
echo -e "${GREEN}🌐 Visit: ${BLUE}https://paulify.eu${NC}"
echo ""
