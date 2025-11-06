#!/bin/bash

echo "🎮 CRUMBPANEL INSTALLER"
echo "======================="

while true; do
    echo ""
    echo "What do you want to do?"
    echo "1) Fresh Install (delete everything)"
    echo "2) Show Backend Logs" 
    echo "3) Show Frontend Logs"
    echo "4) Restart Services"
    echo "5) Exit"
    echo ""
    
    # Wait for user input
    read -p "Choose [1-5]: " choice
    
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
            echo ""
            read -p "Press Enter to continue..."
            ;;
        2)
            echo "📋 BACKEND LOGS:"
            docker logs mc_backend --tail 100
            echo ""
            read -p "Press Enter to continue..."
            ;;
        3)
            echo "📋 FRONTEND LOGS:"
            docker logs mc_frontend --tail 100
            echo ""
            read -p "Press Enter to continue..."
            ;;
        4)
            echo "🔄 RESTARTING..."
            docker compose restart
            echo "✅ RESTARTED!"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        5)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter 1, 2, 3, 4, or 5."
            sleep 2
            ;;
    esac
done
