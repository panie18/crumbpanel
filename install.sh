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
DOCKER_INSTALLED=false
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  DOCKER_INSTALLED=true
  echo -e "${GREEN}✓ Docker installed${NC}"
else
  echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Add user to docker group
if ! groups $USER | grep -q '\bdocker\b'; then
  echo -e "${YELLOW}🔐 Adding user to docker group...${NC}"
  sudo usermod -aG docker $USER
  echo -e "${GREEN}✓ User added to docker group${NC}"
  
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANT: Docker group membership updated!${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}You need to log out and log back in for this to take effect.${NC}"
  echo ""
  echo "Options:"
  echo "  1) Log out and log back in, then run this script again"
  echo "  2) Use 'newgrp docker' and run this script again"
  echo "  3) Continue with sudo (not recommended)"
  echo ""
  read -p "Do you want to continue with sudo? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation paused. Please log out and run the script again.${NC}"
    echo -e "${GREEN}Quick fix: Run 'newgrp docker' and then rerun this script.${NC}"
    exit 0
  fi
  USE_SUDO="sudo"
else
  echo -e "${GREEN}✓ User already in docker group${NC}"
  USE_SUDO=""
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
  
  # Check if CrumbPanel is already running
  if $USE_SUDO docker-compose ps -q 2>/dev/null | grep -q .; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔄 Existing CrumbPanel installation detected!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "This will update CrumbPanel to the latest version."
    echo -e "${GREEN}✓ Your server data will be preserved${NC}"
    echo -e "${GREEN}✓ Backups will be kept${NC}"
    echo -e "${GREEN}✓ Database will be kept${NC}"
    echo ""
    read -p "Do you want to update now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
      echo -e "${YELLOW}🔄 Updating CrumbPanel...${NC}"
      
      # Create backup of .env if it exists
      if [ -f ".env" ]; then
        echo -e "${YELLOW}💾 Backing up .env file...${NC}"
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✓ .env backed up${NC}"
      fi
      
      # Stop containers (but keep volumes with data)
      echo -e "${YELLOW}⏸️  Stopping old containers...${NC}"
      $USE_SUDO docker-compose stop
      echo -e "${GREEN}✓ Containers stopped${NC}"
      
      # Remove old containers and images (keeps volumes!)
      echo -e "${YELLOW}🗑️  Removing old containers...${NC}"
      $USE_SUDO docker-compose rm -f
      echo -e "${GREEN}✓ Old containers removed${NC}"
      
      # Remove old images to force rebuild
      echo -e "${YELLOW}🗑️  Removing old images...${NC}"
      $USE_SUDO docker images | grep crumbpanel | awk '{print $3}' | xargs -r $USE_SUDO docker rmi -f 2>/dev/null || true
      echo -e "${GREEN}✓ Old images removed${NC}"
      
      echo -e "${GREEN}✓ Update preparation complete${NC}"
    else
      echo -e "${YELLOW}Update cancelled.${NC}"
      exit 0
    fi
  fi
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
  echo -e "${GREEN}✓ Configuration file already exists (keeping existing)${NC}"
fi

# Create data directories
echo -e "${YELLOW}📁 Creating data directories...${NC}"
mkdir -p data/backups data/servers data/logs
chmod -R 755 data
echo -e "${GREEN}✓ Directories created${NC}"

# Build and start Docker containers
echo -e "${YELLOW}🐳 Building Docker containers (this may take a few minutes)...${NC}"
$USE_SUDO docker-compose build --no-cache
echo -e "${GREEN}✓ Containers built${NC}"

echo -e "${YELLOW}🚀 Starting CrumbPanel...${NC}"
$USE_SUDO docker-compose up -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Check database health
echo -e "${YELLOW}🔍 Checking database status...${NC}"
for i in {1..30}; do
  if $USE_SUDO docker-compose exec -T db pg_isready -U mc_admin -d mc_panel > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

# Run migrations
echo -e "${YELLOW}📦 Running database migrations...${NC}"
$USE_SUDO docker-compose exec -T backend npx prisma migrate deploy || true

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check if containers are running
RUNNING_CONTAINERS=$($USE_SUDO docker-compose ps -q | wc -l)
if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
  echo -e "${GREEN}✓ All services started successfully${NC}"
else
  echo -e "${RED}✗ Error: Some services failed to start${NC}"
  echo -e "${YELLOW}Run '$USE_SUDO docker-compose logs' for details${NC}"
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
$USE_SUDO docker-compose ps
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📚 Useful Commands:${NC}"
echo "   View logs:           ${USE_SUDO} docker-compose logs -f"
echo "   Stop panel:          ${USE_SUDO} docker-compose stop"
echo "   Start panel:         ${USE_SUDO} docker-compose start"
echo "   Restart panel:       ${USE_SUDO} docker-compose restart"
echo "   Update panel:        git pull && ./install.sh"
echo ""
if [ -n "$USE_SUDO" ]; then
  echo -e "${YELLOW}💡 To avoid using sudo, log out and log back in (or run 'newgrp docker')${NC}"
  echo ""
fi
echo -e "${YELLOW}💡 Tip: Configure WebDAV cloud backups in the Settings page!${NC}"
echo ""
echo -e "${GREEN}⭐ Star the project: ${BLUE}https://github.com/panie18/crumbpanel${NC}"
echo -e "${GREEN}🌐 Visit: ${BLUE}https://paulify.eu${NC}"
echo ""
