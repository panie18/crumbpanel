#!/bin/bash

echo "🗑️  CrumbPanel Reset Script"
echo "=========================="

read -p "Was möchtest du löschen? (1=Alles, 2=Nur Daten, 3=Abbrechen): " choice

case $choice in
    1)
        echo "🗑️  Lösche ALLES (Container, Images, Volumes, Code)..."
        cd ~/crumbpanel
        docker compose down --volumes --remove-orphans
        docker system prune -af --volumes
        cd ~
        rm -rf ~/crumbpanel
        echo "✅ Alles gelöscht!"
        ;;
    2)
        echo "🗑️  Lösche nur Daten (Datenbank, Server-Files)..."
        cd ~/crumbpanel
        docker compose down
        docker volume rm crumbpanel_data 2>/dev/null || true
        rm -rf ./data 2>/dev/null || true
        echo "✅ Daten gelöscht! Code bleibt erhalten."
        echo "🚀 Starte mit: docker compose up -d"
        ;;
    3)
        echo "❌ Abgebrochen."
        ;;
    *)
        echo "❌ Ungültige Auswahl."
        ;;
esac
