#!/bin/bash

echo "🎮 CRUMBPANEL INSTALLER"
echo "======================="

echo "What do you want to do?"
echo "1) Fresh Install (delete everything)"
echo "2) Show Backend Logs" 
echo "3) Show Frontend Logs"
echo "4) Restart Services"
echo ""

read -p "Choose [1-4]: " choice

case $choice in
    1)
        echo "💥 DELETING EVERYTHING..."
        docker compose down --remove-orphans
        sudo rm -rf data/
        sudo rm -rf minecraft-servers/
        docker system prune -f
        
        echo "🔨 BUILDING FRESH..."
        docker compose build --no-cache
        
        echo "🚀 STARTING..."
        docker compose up -d
        
        echo "⏳ WAITING..."
        sleep 30
        
        IP=$(hostname -I | awk '{print $1}')
        echo ""
        echo "✅ DONE! Go to: http://$IP:8437"
        ;;
    2)
        echo "📋 BACKEND LOGS:"
        docker logs mc_backend --tail 100
        ;;
    3)
        echo "📋 FRONTEND LOGS:"
        docker logs mc_frontend --tail 100
        ;;
    4)
        echo "🔄 RESTARTING..."
        docker compose restart
        ;;
esac
