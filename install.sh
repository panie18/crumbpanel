#!/bin/bash

clear
echo "🎮 CRUMBPANEL INSTALLER"
echo "======================="
echo ""

# Function definitions
show_menu() {
    echo "Please select an option:"
    echo ""
    echo "1) 🚀 Fresh Install (Clean everything + Install)"
    echo "2) 🔄 Restart Services (Keep data)"
    echo "3) 🔨 Rebuild Only (Keep data + Rebuild containers)"
    echo "4) 🗑️ Clean Database Only (Reset users/servers)"
    echo "5) 🏥 Health Check"
    echo "6) 📋 Show Logs"
    echo "7) 🛑 Stop Services"
    echo "8) ❌ Exit"
    echo ""
    read -p "Enter your choice [1-8]: " choice
}

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
    docker compose down

    echo "🗑️ Removing all data..."
    sudo rm -rf data/
    sudo rm -rf minecraft-servers/
    sudo rm -rf backups/

    echo "🧹 Cleaning Docker..."
    docker system prune -f
    docker volume prune -f
    docker image prune -f

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

    wait_for_services
    show_success
}

restart_services() {
    echo ""
    echo "🔄 Restarting services (keeping data)..."
    docker compose down
    docker compose up -d
    
    wait_for_services
    echo "✅ Services restarted successfully!"
}

rebuild_containers() {
    echo ""
    echo "🔨 Rebuilding containers (keeping data)..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    
    wait_for_services
    echo "✅ Containers rebuilt successfully!"
}

clean_database() {
    echo ""
    echo "🗑️ WARNING: This will DELETE all database data!"
    echo "   - All users will be deleted"
    echo "   - All servers will be lost"
    echo "   - Minecraft server files will be kept"
    echo ""
    read -p "Are you sure? (type 'yes' to continue): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Database cleanup cancelled"
        return
    fi

    echo "🛑 Stopping backend..."
    docker compose stop backend

    echo "🗑️ Removing database..."
    sudo rm -rf data/*.db
    sudo rm -rf data/*.sqlite*

    echo "🚀 Starting backend..."
    docker compose up -d backend

    echo "⏳ Waiting for backend..."
    sleep 10

    echo "✅ Database cleaned! You can now run setup again."
}

health_check() {
    echo ""
    echo "🏥 Running health check..."
    echo ""

    # Check containers
    echo "📦 Container Status:"
    docker compose ps
    echo ""

    # Check backend
    echo "🔧 Backend Health:"
    if curl -f http://localhost:5829/api/auth/setup-status &> /dev/null; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend is not responding"
    fi

    # Check frontend
    echo "🌐 Frontend Health:"
    if curl -f http://localhost:8437 &> /dev/null; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend is not responding"
    fi

    # Check setup status
    echo ""
    echo "📊 Setup Status:"
    curl -s http://localhost:5829/api/auth/setup-status | python3 -m json.tool 2>/dev/null || echo "Could not retrieve setup status"
    
    echo ""
    echo "📁 Data Directory:"
    ls -la data/ 2>/dev/null || echo "No data directory"
}

show_logs() {
    echo ""
    echo "Which logs do you want to see?"
    echo "1) Backend logs"
    echo "2) Frontend logs" 
    echo "3) All logs"
    echo ""
    read -p "Enter choice [1-3]: " log_choice

    case $log_choice in
        1)
            echo "📋 Backend logs (last 50 lines):"
            docker logs mc_backend --tail 50
            ;;
        2)
            echo "📋 Frontend logs (last 50 lines):"
            docker logs mc_frontend --tail 50
            ;;
        3)
            echo "📋 All logs (last 50 lines each):"
            echo ""
            echo "=== BACKEND LOGS ==="
            docker logs mc_backend --tail 50
            echo ""
            echo "=== FRONTEND LOGS ==="
            docker logs mc_frontend --tail 50
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
}

stop_services() {
    echo ""
    echo "🛑 Stopping all services..."
    docker compose down
    echo "✅ All services stopped"
}

wait_for_services() {
    echo "⏳ Waiting for services to start..."
    sleep 15

    echo "🏥 Health checking..."
    local retries=0
    local max_retries=6

    while [ $retries -lt $max_retries ]; do
        if curl -f http://localhost:5829/api/auth/setup-status &> /dev/null; then
            echo "✅ Backend is ready"
            break
        fi
        echo "⏳ Backend still starting... (attempt $((retries + 1))/$max_retries)"
        sleep 10
        retries=$((retries + 1))
    done

    if [ $retries -eq $max_retries ]; then
        echo "⚠️ Backend might not be fully ready yet"
    fi
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
    echo "💾 Database:      SQLite in ./data/crumbpanel.db"
    echo ""
    echo "📋 Container Status:"
    docker compose ps
    echo ""
    echo "🎯 NEXT STEPS:"
    echo "1. Go to http://$ip:8437"
    echo "2. Complete the setup wizard"
    echo "3. Create your first Minecraft server"
    echo ""
    echo "📚 Useful commands:"
    echo "   ./install.sh     - Run this installer again"
    echo "   docker compose logs -f    - Follow live logs"
    echo "   docker compose down       - Stop all services"
    echo ""
    echo "⭐ Star: https://github.com/panie18/crumbpanel"
}

# Main execution
check_docker

while true; do
    show_menu
    case $choice in
        1)
            fresh_install
            ;;
        2)
            restart_services
            ;;
        3)
            rebuild_containers
            ;;
        4)
            clean_database
            ;;
        5)
            health_check
            ;;
        6)
            show_logs
            ;;
        7)
            stop_services
            ;;
        8)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to return to menu..."
done
