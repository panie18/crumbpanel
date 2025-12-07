# 🚀 Installation & Erste Schritte

## Was ist CrumbPanel?

CrumbPanel ist ein modernes, webbasiertes Panel zur Verwaltung von Minecraft-Servern. Es bietet:

- ✅ Einfache Server-Erstellung mit einem Klick
- ✅ Live-Konsole mit Echtzeit-Logs
- ✅ Plugin-Verwaltung
- ✅ Automatisierte Tasks & Workflows
- ✅ Backup-System
- ✅ Multi-User-Support mit Rollen
- ✅ 2FA-Authentifizierung (TOTP & FIDO2)

## Systemanforderungen

### Minimum

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **RAM**: 2 GB
- **CPU**: 2 Kerne
- **Disk**: 10 GB freier Speicher
- **Software**: Docker 20.10+, Docker Compose 2.0+

### Empfohlen

- **OS**: Ubuntu 22.04 LTS oder Debian 12
- **RAM**: 4 GB oder mehr
- **CPU**: 4 Kerne oder mehr
- **Disk**: 50 GB SSD
- **Software**: Docker 24.0+, Docker Compose 2.20+

## Installation

### Methode 1: Automatisches Installations-Script (Empfohlen)

Das einfachste und schnellste Setup:

```bash
# Script herunterladen und ausführen
curl -fsSL https://raw.githubusercontent.com/panie18/crumbpanel/main/install.sh | bash
```

Das Script macht automatisch:

1. **Prüft Systemvoraussetzungen**
   - Docker & Docker Compose installiert?
   - Git vorhanden?

2. **Bereitet Installation vor**
   - Löscht alte Installationen (falls vorhanden)
   - Klont das Repository nach `~/crumbpanel`

3. **Erstellt notwendige Verzeichnisse**
   ```
   ~/crumbpanel/
   ├── data/           # Datenbank & Konfiguration
   ├── backups/        # Server-Backups
   └── minecraft-servers/  # Server-Daten
   ```

4. **Baut Docker-Container**
   - Frontend (React + Vite)
   - Backend (NestJS)
   - Datenbank (PostgreSQL) - optional

5. **Startet das Panel**
   - Wartet 30 Sekunden auf vollständigen Start
   - Zeigt Zugriffs-URLs an

#### Nach der Installation

```bash
# Panel öffnen
http://DEINE-IP:8437

# Standard-Login
Email: admin@mcpanel.local
Passwort: admin123
```

⚠️ **WICHTIG:** Ändere das Admin-Passwort sofort nach dem ersten Login!

### Methode 2: Manuelle Installation

Für erweiterte Kontrolle oder wenn du Anpassungen vornehmen möchtest:

#### Schritt 1: Repository klonen

```bash
cd ~
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel
```

#### Schritt 2: Umgebungsvariablen konfigurieren

```bash
# .env-Datei erstellen
cp .env.example .env

# Mit deinem Lieblings-Editor bearbeiten
nano .env
```

Wichtige Variablen in `.env`:

```env
# Datenbank
POSTGRES_USER=mc_admin
POSTGRES_PASSWORD=SICHERES_PASSWORT_HIER  # Ändern!
POSTGRES_DB=mc_panel

# Backend
PORT=5829
JWT_SECRET=MINDESTENS_32_ZEICHEN_LANG  # Ändern!
JWT_REFRESH_SECRET=AUCH_32_ZEICHEN_LANG  # Ändern!
ENCRYPTION_KEY=GENAU_16_ZEICHEN  # Ändern!

# Admin-Account
ADMIN_EMAIL=admin@mcpanel.local
ADMIN_PASSWORD=admin123  # Ändern!
```

#### Schritt 3: Verzeichnisse erstellen

```bash
mkdir -p data backups minecraft-servers
sudo chown -R $(whoami):$(whoami) .
chmod -R 755 .
```

#### Schritt 4: Container bauen und starten

```bash
# Ohne Cache bauen (empfohlen für erste Installation)
docker compose build --no-cache

# Container starten
docker compose up -d

# Logs anschauen (optional)
docker compose logs -f
```

#### Schritt 5: Installation verifizieren

```bash
# Container-Status prüfen
docker compose ps

# Sollte ungefähr so aussehen:
# NAME          IMAGE                 STATUS
# mc_backend    crumbpanel-backend    Up 30 seconds
# mc_frontend   crumbpanel-frontend   Up 30 seconds
```

Öffne dann im Browser: `http://localhost:8437`

## Erster Login

### 1. Panel öffnen

Navigiere zu `http://DEINE-IP:8437` oder `http://localhost:8437`

### 2. Mit Standard-Credentials einloggen

```
Email:    admin@mcpanel.local
Passwort: admin123
```

### 3. Passwort sofort ändern

1. Klicke oben rechts auf dein Profil
2. Wähle "Settings" oder "Einstellungen"
3. Unter "Security" → "Change Password"
4. Neues, sicheres Passwort eingeben
5. Speichern

### 4. 2FA aktivieren (optional, aber empfohlen)

1. In den Settings → "Security"
2. "Enable Two-Factor Authentication"
3. QR-Code mit einer Authenticator-App scannen (z.B. Google Authenticator, Authy)
4. Bestätigungscode eingeben
5. Backup-Codes sicher speichern!

## Nächste Schritte

Nach erfolgreichem Login kannst du:

- [Deinen ersten Server erstellen](./03-server-management.md#ersten-server-erstellen)
- [Benutzer hinzufügen](./02-user-guide.md#benutzerverwaltung)
- [Plugins installieren](./04-advanced-features.md#plugin-management)
- [Automatisierungen einrichten](./04-advanced-features.md#automations)

## Häufige Installations-Probleme

### Problem: Docker nicht gefunden

```bash
# Docker installieren (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose installieren
sudo apt update
sudo apt install docker-compose-plugin
```

### Problem: Port 8437 oder 5829 bereits belegt

```bash
# Prüfen, was den Port nutzt
sudo lsof -i :8437
sudo lsof -i :5829

# Anderen Port in docker-compose.yml setzen, z.B.:
ports:
  - "9000:80"  # Frontend jetzt auf Port 9000
```

### Problem: Permission Denied

```bash
# Berechtigungen reparieren
cd ~/crumbpanel
sudo chown -R $(whoami):$(whoami) .
chmod -R 755 .

# Docker-Gruppe beitreten (einmalig)
sudo usermod -aG docker $USER
newgrp docker
```

### Problem: Container starten nicht

```bash
# Logs prüfen
cd ~/crumbpanel
docker compose logs -f

# Alles neu bauen
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Deinstallation

### Nur Panel löschen (Daten behalten)

```bash
cd ~/crumbpanel
docker compose down
```

### Panel UND Daten komplett entfernen

```bash
cd ~/crumbpanel
docker compose down --volumes
cd ~
rm -rf ~/crumbpanel
```

### Nuclear Reset (alles löschen, inkl. Docker-Cache)

```bash
cd ~/crumbpanel
./reset-all.sh
```

---

[➡️ Weiter zum Benutzerhandbuch](./02-user-guide.md)
