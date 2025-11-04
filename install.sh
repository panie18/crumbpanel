#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CrumbPanel - Installation Script                     ║"
echo "╚════════════════════════════════════════════════════════╝"

# Prüfe ob Git installiert ist
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install git first."
    exit 1
fi

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Prüfe ob docker-compose installiert ist
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Lösche altes Verzeichnis falls vorhanden
if [ -d "crumbpanel" ]; then
    echo "Removing old installation..."
    cd crumbpanel
    docker-compose down -v 2>/dev/null || true
    cd ..
    rm -rf crumbpanel
fi

# Clone Repository
echo "Cloning CrumbPanel repository..."
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Erstelle Ordner
echo "Creating directories..."
mkdir -p data/backups data/servers

# Baue und starte Container
echo ""
echo "Building Docker containers..."
echo "This may take several minutes on first install..."
docker-compose build --no-cache

echo ""
echo "Starting services..."
docker-compose up -d

# Warte auf Start
echo ""
echo "Waiting for services to start (30 seconds)..."
for i in {30..1}; do
  printf "\rTime remaining: %02d seconds" $i
  sleep 1
done
echo ""

# Zeige Status
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Access your panel at:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):8437"
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):5829"
echo ""

# Container Status
echo "Container Status:"
docker-compose ps

# Zeige Logs
echo ""
echo "Recent Logs:"
echo "─────────────────────────────────────────"
docker logs --tail 20 mc_backend 2>/dev/null || echo "Backend starting..."
echo ""
docker logs --tail 10 mc_frontend 2>/dev/null || echo "Frontend starting..."

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Useful Commands:                                      ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  View logs:        docker-compose logs -f              ║"
echo "║  Stop services:    docker-compose down                 ║"
echo "║  Restart:          docker-compose restart              ║"
echo "║  Update:           git pull && docker-compose up -d --build ║"
echo "╚════════════════════════════════════════════════════════╝"
