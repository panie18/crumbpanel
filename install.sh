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

# COMPLETE CLEANUP - Remove ALL broken files with proper rm -rf
echo -e "${YELLOW}🧹 Complete cleanup of broken files...${NC}"
find backend/src -name "audit" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "cloud-backup" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "files" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "metrics" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "players" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "websocket" -type d -exec rm -rf {} + 2>/dev/null || true
find backend -name "prisma" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "dto" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "guards" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/src -name "strategies" -type d -exec rm -rf {} + 2>/dev/null || true
rm -f backend/src/servers/rcon.service.ts 2>/dev/null || true
rm -f backend/src/index.ts 2>/dev/null || true

# OVERWRITE with clean TypeORM files
echo -e "${YELLOW}✏️ Creating clean TypeORM files...${NC}"

# Overwrite auth.service.ts with clean version
cat > backend/src/auth/auth.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateAuth0User(profile: any) {
    const { id, emails, displayName, photos } = profile;
    
    let user = await this.userRepository.findOne({
      where: { auth0Id: id },
    });

    if (!user) {
      user = await this.userRepository.save({
        auth0Id: id,
        email: emails[0].value,
        name: displayName,
        picture: photos[0]?.value,
        role: 'ADMIN',
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };
    
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
EOF

# Overwrite servers.service.ts with clean version
cat > backend/src/servers/servers.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async getAll() {
    return this.serverRepository.find({
      relations: ['players', 'backups'],
    });
  }

  async create(data: any) {
    return this.serverRepository.save({
      name: data.name,
      port: data.port,
      rconPort: data.rconPort,
      rconPassword: data.rconPassword,
      version: data.version,
      maxRam: data.maxRam,
    });
  }

  async findById(id: string) {
    return this.serverRepository.findOne({
      where: { id },
      relations: ['players', 'backups'],
    });
  }
}
EOF

echo -e "${GREEN}✓ Clean files created${NC}"

# Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p data/backups data/servers data/logs
chmod -R 755 data

# Remove old build artifacts
echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
rm -rf backend/node_modules backend/dist 2>/dev/null || true
rm -rf frontend/node_modules frontend/dist 2>/dev/null || true

# Stop old containers
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker compose down -v 2>/dev/null || true

# Remove old images
echo -e "${YELLOW}🗑️ Removing old images...${NC}"
docker image rm crumbpanel-backend crumbpanel-frontend 2>/dev/null || true

# Build fresh containers
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker compose build --no-cache

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker compose up -d

# Wait for backend
echo -e "${YELLOW}⏳ Waiting for backend...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:5829/api/auth/me > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend ready${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}Backend failed. Logs:${NC}"
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
    echo -e "${GREEN}✓ Frontend ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Frontend failed. Logs:${NC}"
    docker compose logs frontend
    exit 1
  fi
  sleep 1
done

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ INSTALLATION COMPLETE! ✅                ║"
echo "║          Made by paulify.dev (https://paulify.eu)     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access: http://${IP}:8437${NC}"
echo -e "${GREEN}🔧 API: http://localhost:5829/api${NC}"
echo -e "${GREEN}💾 Database: SQLite in ./data/crumbpanel.db${NC}"
echo ""
docker compose ps
echo ""
echo -e "${YELLOW}🔐 Configure Auth0 at https://manage.auth0.com${NC}"
echo -e "${GREEN}⭐ Star: https://github.com/panie18/crumbpanel${NC}"
