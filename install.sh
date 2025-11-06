#!/bin/bash

clear
echo "🎮 CRUMBPANEL INSTALLER"
echo "======================="
echo ""

# Check Docker first
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found! Please install Docker first."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        echo "❌ Docker Compose not found! Please install Docker Compose first."
        exit 1
    fi
    echo "✅ Docker found"
}

fresh_install() {
    echo ""
    echo "🚨 WARNING: This will DELETE ALL DATA!"
    echo "   - All servers will be lost"
    echo "   - All users will be deleted"  
    echo "   - All settings will be reset"
    echo ""
    read -p "Are you ABSOLUTELY sure? (type 'YES' to continue): " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo "❌ Installation cancelled"
        return
    fi

    echo ""
    echo "🛑 Stopping all containers..."
    docker compose down 2>/dev/null

    echo "🗑️ Removing all data..."
    sudo rm -rf data/
    sudo rm -rf minecraft-servers/
    sudo rm -rf backups/

    echo "🧹 Cleaning Docker..."
    docker system prune -f
    docker volume prune -f

    echo "📁 Creating directories..."
    mkdir -p data
    mkdir -p minecraft-servers  
    mkdir -p backups

    echo "🔐 Setting permissions..."
    sudo chown -R $(whoami):$(whoami) .

    echo "🔨 Building containers..."
    docker compose build --no-cache

    echo "🚀 Starting services..."
    docker compose up -d

    echo "⏳ Waiting for services..."
    sleep 20

    show_success
}

show_success() {
    local ip=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║            ✅ INSTALLATION COMPLETE! ✅                ║"
    echo "║          Made by paulify.dev (https://paulify.eu)     ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Local Access:  http://localhost:8437"
    echo "🌐 Network Access: http://$ip:8437"
    echo "🔧 API Endpoint:  http://localhost:5829/api"
    echo "💾 Database:      Fresh SQLite database"
    echo ""
    echo "📋 Container Status:"
    docker compose ps
    echo ""
    echo "🎯 NEXT STEPS:"
    echo "1. Go to http://$ip:8437"
    echo "2. Complete the setup wizard"
    echo "3. Create your first Minecraft server"
    echo ""
    echo "⭐ Star: https://github.com/panie18/crumbpanel"
}

# Main execution
check_docker

echo "Please select an option:"
echo ""
echo "1) 🚀 Fresh Install (Clean everything + Install)"
echo "2) 🔄 Restart Services (Keep data)"
echo "3) 🏥 Health Check"
echo "4) 📋 Show Logs"
echo "5) 🛑 Stop Services"
echo "6) ❌ Exit"
echo ""

while true; do
    read -p "Enter your choice [1-6]: " choice
    echo "Debug: You entered '$choice'"
    
    case "$choice" in
        "1")
            fresh_install
            break
            ;;
        "2")
            echo "🔄 Restarting services..."
            docker compose down
            docker compose up -d
            echo "✅ Services restarted!"
            break
            ;;
        "3")
            echo "🏥 Health Check:"
            docker compose ps
            echo ""
            curl -s http://localhost:5829/api/auth/setup-status || echo "Backend not responding"
            break
            ;;
        "4")
            echo "📋 Backend logs:"
            docker logs mc_backend --tail 50
            break
            ;;
        "5")
            echo "🛑 Stopping services..."
            docker compose down
            echo "✅ Services stopped"
            break
            ;;
        "6")
            echo "👋 Goodbye!"
            exit 0
            ;;
        "")
            echo "❌ Please enter a number between 1-6"
            ;;
        *)
            echo "❌ Invalid option '$choice'. Please enter 1, 2, 3, 4, 5, or 6."
            ;;
    esac
done
