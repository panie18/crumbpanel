#!/bin/bash

# Function to wait for user input
wait_for_input() {
    echo ""
    echo "Press ENTER to continue or CTRL+C to exit..."
    read
}

# Function to show menu and get choice
get_choice() {
    echo ""
    echo "🎮 CRUMBPANEL INSTALLER"
    echo "======================="
    echo ""
    echo "1) 🚀 Fresh Install (delete everything)"
    echo "2) 📋 Show Backend Logs" 
    echo "3) 📋 Show Frontend Logs"
    echo "4) 🔄 Restart Services"
    echo "5) 🛑 Exit"
    echo ""
    
    while true; do
        echo -n "Choose [1-5]: "
        read choice
        
        case $choice in
            1|2|3|4|5)
                return $choice
                ;;
            *)
                echo "❌ Please enter 1, 2, 3, 4, or 5"
                ;;
        esac
    done
}

# Main loop
while true; do
    get_choice
    choice=$?
    
    case $choice in
        1)
            echo ""
            echo "💥 STARTING FRESH INSTALL..."
            echo "This will DELETE ALL DATA!"
            echo ""
            echo -n "Are you sure? (y/N): "
            read confirm
            
            if [[ $confirm == "y" || $confirm == "Y" ]]; then
                echo "🛑 Stopping containers..."
                docker compose down --remove-orphans
                
                echo "🗑️ Deleting data..."
                sudo rm -rf data/
                sudo rm -rf minecraft-servers/
                
                echo "🧹 Cleaning docker..."
                docker system prune -f
                
                echo "🔨 Building fresh..."
                docker compose build --no-cache
                
                echo "🚀 Starting services..."
                docker compose up -d
                
                echo "⏳ Waiting 30 seconds..."
                sleep 30
                
                IP=$(hostname -I | awk '{print $1}')
                echo ""
                echo "✅ INSTALLATION COMPLETE!"
                echo "🌐 Go to: http://$IP:8437"
                
                wait_for_input
            else
                echo "❌ Fresh install cancelled"
                wait_for_input
            fi
            ;;
        2)
            echo ""
            echo "📋 BACKEND LOGS (last 100 lines):"
            echo "================================="
            docker logs mc_backend --tail 100
            wait_for_input
            ;;
        3)
            echo ""
            echo "📋 FRONTEND LOGS (last 100 lines):"
            echo "==================================="
            docker logs mc_frontend --tail 100
            wait_for_input
            ;;
        4)
            echo ""
            echo "🔄 RESTARTING SERVICES..."
            docker compose restart
            echo "✅ Services restarted!"
            wait_for_input
            ;;
        5)
            echo ""
            echo "👋 Goodbye!"
            exit 0
            ;;
    esac
done
