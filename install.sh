#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════"
echo "  CrumbPanel Installation - ULTIMATE FIX"
echo "════════════════════════════════════════════════════════"

# Install Docker if needed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose
fi

# Clone repo
if [ ! -d "crumbpanel" ]; then
    git clone https://github.com/panie18/crumbpanel.git
fi

cd crumbpanel
git pull

# Create .env
if [ ! -f ".env" ]; then
    echo "🔐 Creating .env..."
    cat > .env << EOF
POSTGRES_USER=mc_admin
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=mc_panel
DATABASE_URL=postgresql://mc_admin:PASSWORD@db:5432/mc_panel
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
PORT=5829
EOF
fi

# Create directories
mkdir -p data/backups data/servers data/logs

# Stop old containers
echo "🛑 Stopping old containers..."
sudo docker-compose down -v 2>/dev/null || true

# Build fresh
echo "🔨 Building containers..."
sudo docker-compose build --no-cache

# Start
echo "🚀 Starting services..."
sudo docker-compose up -d

# Wait
echo "⏳ Waiting for services..."
sleep 20

# Check
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ Installation complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Open: http://$(hostname -I | awk '{print $1}'):8437"
echo ""
sudo docker-compose ps
