<div align="center">
  <img src="logo.png" alt="CrumbPanel Logo" width="200" height="200">
  
  # 🎮 CrumbPanel
  
  **The Ultimate Minecraft Server Management Panel**
  
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)](https://typescriptlang.org)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://paulify.eu)

  *Professional Minecraft server management made simple*
</div>

---

## 🚀 Quick Install (Recommended)

**One-line automatic installation:**

```bash
curl -fsSL https://raw.githubusercontent.com/panie18/crumbpanel/main/install.sh | bash
```

This script will:
- ✅ Install Docker & Docker Compose (if not present)
- ✅ Clone the repository
- ✅ Generate secure secrets automatically
- ✅ Create `.env` configuration
- ✅ Build and start all containers
- ✅ Create default admin account

**After installation, access the panel at:**
- 🌐 Frontend: `http://localhost:8437`
- 🔌 Backend API: `http://localhost:5829/api`

**Default login credentials:**
- Email: `admin@mcpanel.local`
- Password: `admin123`

⚠️ **Important:** Change the admin password after first login!

---

## 📦 Manual Installation

If you prefer to install manually:

```bash
# Clone repository
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Create .env file
cp .env.example .env
# Edit .env and set your own secure passwords

# Start with Docker Compose
docker-compose up -d --build
```

---

## ✨ Features

### 🎯 **Core Management**
- 🚀 **One-Click Server Creation** - Java & Bedrock support
- 🎮 **Live Server Console** - Real-time logs & command execution  
- 📊 **Performance Monitoring** - TPS, RAM, CPU tracking
- 🔄 **Auto-Updates** - Latest Minecraft versions from Mojang API
- 💾 **Smart Backups** - Automated backup system

### 🗺️ **Advanced Features**
- 🏡 **Player Base Map** - Interactive world exploration
- 🏆 **Leaderboards** - Player statistics & competitions
- ⚡ **Workflow Automation** - Custom triggers & actions
- 🔌 **Plugin Marketplace** - Browse & install plugins
- 🌐 **Multi-Server Cluster** - Manage multiple servers

### 🔐 **Security & Auth**
- 👤 **Multi-User Support** - Role-based access control
- 🛡️ **2FA Authentication** - TOTP & FIDO2/WebAuthn
- 🔑 **JWT Security** - Secure API authentication
- 📱 **Session Management** - Cross-device compatibility

## 🚀 Quick Start

### One-Line Install
```bash
curl -fsSL https://raw.githubusercontent.com/panie18/crumbpanel/main/install.sh | bash
```

### Manual Install
```bash
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel
chmod +x install.sh
./install.sh
```

### 2. Start CrumbPanel
```bash
docker compose up -d
```

### 3. Access Panel
Open your browser and navigate to:
- Frontend: `http://localhost:8437`
- Backend API: `http://localhost:5829/api`

**Default login credentials:**
- Email: `admin@mcpanel.local`
- Password: `admin123`

⚠️ **Important:** Change the admin password after first login!

## 📦 Technology Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui + Framer Motion
- **Backend**: NestJS + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT + Refresh Tokens + bcrypt
- **Server Control**: RCON + Query Protocol
- **Cloud Backup**: WebDAV (Nextcloud, ownCloud, etc.)
- **Deployment**: Docker + Docker Compose

## 🔧 Configuration

### Ports

- **Frontend**: `8437`
- **Backend**: `5829`
- **Database**: `5432`

### Default Login

- Email: `admin@mcpanel.local`
- Password: `admin123`

**⚠️ Important**: Change the password after first login!

### WebDAV Cloud Backup (Optional)

Add the following environment variables to `.env`:

```env
WEBDAV_URL=https://your-nextcloud.com/remote.php/dav/files/username/
WEBDAV_USERNAME=your_username
WEBDAV_PASSWORD=your_password
WEBDAV_REMOTE_PATH=/minecraft-backups
```

## 📚 API Documentation

### Authentication

```http
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Server Management

```http
GET    /api/servers
POST   /api/servers
GET    /api/servers/:id
PUT    /api/servers/:id
DELETE /api/servers/:id
POST   /api/servers/:id/start
POST   /api/servers/:id/stop
POST   /api/servers/:id/restart
```

### WebSocket (Live Console)

```bash
# View logs
docker-compose logs -f

# Stop panel
docker-compose stop

# Start panel
docker-compose start

# Restart panel
docker-compose restart

# Update to latest version
cd crumbpanel
git pull
docker-compose down
docker-compose up -d --build

# Access database
docker-compose exec db psql -U mc_admin -d mc_panel

# Backup database
docker-compose exec db pg_dump -U mc_admin mc_panel > backup.sql
```

## 🔄 Updates

**Easy update with install script (recommended):**

```bash
cd crumbpanel
git pull
./install.sh
```

The script will:
- ✅ Keep all your server data
- ✅ Keep all backups
- ✅ Keep database with users
- ✅ Keep your `.env` configuration
- ✅ Only update the application containers

**Manual update:**

```bash
cd crumbpanel
git pull
docker-compose down    # Stops containers but keeps volumes
docker-compose build --no-cache
docker-compose up -d
```

⚠️ **Never use `docker-compose down -v`** - this deletes all data including servers!

---

## 🐛 Troubleshooting

### Docker Permission Denied Error

If you get a "Permission denied" error when running Docker commands:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify docker works without sudo
docker ps
```

### Port Already in Use

If ports 8437 or 5829 are already in use:

```bash
# Check what's using the port
sudo lsof -i :8437
sudo lsof -i :5829

# Edit .env and docker-compose.yml to use different ports
```

### Containers Won't Start

```bash
# Check logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Reset everything (WARNING: deletes all data)
docker-compose down -v
rm -rf data/
./install.sh
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

### WebDAV Cloud Backup Issues

Make sure your WebDAV credentials are correct in `.env`:

```env
WEBDAV_URL=https://your-nextcloud.com/remote.php/dav/files/username/
WEBDAV_USERNAME=your_username
WEBDAV_PASSWORD=your_app_password  # Use app password, not main password
WEBDAV_REMOTE_PATH=/minecraft-backups
```

For Nextcloud:
1. Go to Settings → Security
2. Create a new app password
3. Use that password in WEBDAV_PASSWORD

### Build Failed - npm ci Error

If you get `npm ci` error during build:

```bash
# This happens when package-lock.json is missing
# The Dockerfile now uses npm install instead

# If issue persists, rebuild without cache:
cd crumbpanel
docker-compose build --no-cache
docker-compose up -d
```

---

## 🌍 Multi-Language Quick Help & Troubleshooting

> This section gives a very short overview and common fixes in multiple languages.

---

### 🇩🇪 Deutsch – Kurzanleitung & Fehlerbehebung

**Was ist CrumbPanel?**  
CrumbPanel ist ein Web-Panel, mit dem du Minecraft-Server per Browser verwalten kannst (Start/Stop, Konsole, Plugins, Automationen, Einstellungen usw.).

**Start nach der Installation**

```bash
cd ~/crumbpanel
docker compose up -d
```

Öffne dann im Browser:

- Panel: `http://DEINE-IP:8437` oder `http://localhost:8437`
- API (optional): `http://DEINE-IP:5829/api`

**Standard-Login**

- E-Mail: `admin@mcpanel.local`
- Passwort: `admin123`  
➡️ Sofort nach dem ersten Login ändern!

**Häufige Probleme**

1. **Seite lädt nicht / Verbindung abgelehnt**

   - Prüfe Container:
     ```bash
     cd ~/crumbpanel
     docker compose ps
     docker compose logs -f
     ```
   - Ports 8437 und 5829 dürfen nicht von anderen Programmen belegt sein.

2. **Änderungen werden nicht übernommen**

   - Nach Code-Änderungen neu bauen:
     ```bash
     docker compose down
     docker compose build --no-cache
     docker compose up -d
     ```

3. **Alles zerschossen / komplett neu beginnen**

   - Vorsicht: löscht wirklich alles!
     ```bash
     cd ~/crumbpanel
     ./reset-all.sh
     ```

---

### 🇬🇧 English – Quick Guide & Troubleshooting

**What is CrumbPanel?**  
CrumbPanel is a web panel to manage Minecraft servers from your browser (start/stop, console, plugins, automations, settings, etc.).

**Start after installation**

```bash
cd ~/crumbpanel
docker compose up -d
```

Open in your browser:

- Panel: `http://YOUR-IP:8437` or `http://localhost:8437`
- API (optional): `http://YOUR-IP:5829/api`

**Default login**

- Email: `admin@mcpanel.local`
- Password: `admin123`  
➡️ Change this immediately after the first login!

**Common issues**

1. **Site not loading / connection refused**

   - Check containers:
     ```bash
     cd ~/crumbpanel
     docker compose ps
     docker compose logs -f
     ```

2. **Frontend/backend changes not visible**

   - Rebuild images:
     ```bash
     docker compose down
     docker compose build --no-cache
     docker compose up -d
     ```

3. **Completely broken / want factory reset**

   - WARNING: deletes everything:
     ```bash
     cd ~/crumbpanel
     ./reset-all.sh
     ```

---

### 🇫🇷 Français – Guide rapide & Dépannage

**Qu’est-ce que CrumbPanel ?**  
CrumbPanel est un panneau web pour gérer des serveurs Minecraft (démarrage/arrêt, console, plugins, automatisations, paramètres, etc.).

**Démarrage après l’installation**

```bash
cd ~/crumbpanel
docker compose up -d
```

Dans votre navigateur :

- Panel : `http://VOTRE-IP:8437` ou `http://localhost:8437`
- API : `http://VOTRE-IP:5829/api`

**Identifiants par défaut**

- Email : `admin@mcpanel.local`
- Mot de passe : `admin123`  
➡️ Changez le mot de passe après la première connexion !

**Problèmes fréquents**

- Vérifier l’état des conteneurs :
  ```bash
  docker compose ps
  docker compose logs -f
  ```

- Reconstruire en cas de modification :
  ```bash
  docker compose down
  docker compose build --no-cache
  docker compose up -d
  ```

---

### 🇪🇸 Español – Guía rápida & Solución de problemas

**¿Qué es CrumbPanel?**  
CrumbPanel es un panel web para administrar servidores de Minecraft (inicio/parada, consola, plugins, automatizaciones, ajustes, etc.).

**Inicio después de la instalación**

```bash
cd ~/crumbpanel
docker compose up -d
```

En el navegador:

- Panel: `http://TU-IP:8437` o `http://localhost:8437`
- API: `http://TU-IP:5829/api`

**Credenciales por defecto**

- Email: `admin@mcpanel.local`
- Contraseña: `admin123`  
➡️ ¡Cambia la contraseña tras el primer inicio de sesión!

**Problemas típicos**

- Ver contenedores y logs:
  ```bash
  docker compose ps
  docker compose logs -f
  ```

- Reconstruir si hay errores de build o cambios:
  ```bash
  docker compose down
  docker compose build --no-cache
  docker compose up -d
  ```

---

### 🇨🇳 简体中文 – 快速指南与故障排除

**CrumbPanel 是什么？**  
CrumbPanel 是一个网页面板，用于在浏览器中管理 Minecraft 服务器（启动/停止、控制台、插件、自动化、配置等）。

**安装后启动**

```bash
cd ~/crumbpanel
docker compose up -d
```

浏览器打开：

- 面板: `http://你的IP:8437` 或 `http://localhost:8437`
- API: `http://你的IP:5829/api`

**默认账号**

- 邮箱: `admin@mcpanel.local`
- 密码: `admin123`  
➡️ 第一次登录后请立即修改密码！

**常见问题**

- 查看容器状态和日志：
  ```bash
  docker compose ps
  docker compose logs -f
  ```

- 修改代码后重新构建：
  ```bash
  docker compose down
  docker compose build --no-cache
  docker compose up -d
  ```

---

### 🇯🇵 日本語 – クイックガイド & トラブルシュート

**CrumbPanel とは？**  
CrumbPanel は、ブラウザから Minecraft サーバーを管理するための Web パネルです（起動/停止、コンソール、プラグイン、自動化、設定など）。

**インストール後の起動**

```bash
cd ~/crumbpanel
docker compose up -d
```

ブラウザでアクセス：

- パネル: `http://あなたのIP:8437` または `http://localhost:8437`
- API: `http://あなたのIP:5829/api`

**デフォルトログイン**

- メール: `admin@mcpanel.local`
- パスワード: `admin123`  
➡️ 初回ログイン後に必ず変更してください。

**よくある問題**

- コンテナとログを確認：
  ```bash
  docker compose ps
  docker compose logs -f
  ```

---

### 🇳🇱 Nederlands – Korte handleiding & Probleemoplossing

**Wat is CrumbPanel?**  
CrumbPanel is een webpaneel om Minecraft-servers via de browser te beheren (start/stop, console, plugins, automatisering, instellingen, enz.).

**Starten na installatie**

```bash
cd ~/crumbpanel
docker compose up -d
```

In je browser:

- Paneel: `http://JOUW-IP:8437` of `http://localhost:8437`
- API: `http://JOUW-IP:5829/api`

**Standaard login**

- E‑mail: `admin@mcpanel.local`
- Wachtwoord: `admin123`  
➡️ Wachtwoord direct na de eerste login wijzigen!

**Veelvoorkomende problemen**

- Containerstatus:
  ```bash
  docker compose ps
  docker compose logs -f
  ```

---

### 🇩🇰 Dansk – Kort guide & fejlfinding

**Hvad er CrumbPanel?**  
CrumbPanel er et webpanel til at styre Minecraft-servere i browseren (start/stop, konsol, plugins, automation, indstillinger osv.).

**Start efter installation**

```bash
cd ~/crumbpanel
docker compose up -d
```

I browseren:

- Panel: `http://DIN-IP:8437` eller `http://localhost:8437`
- API: `http://DIN-IP:5829/api`

**Standard-login**

- Email: `admin@mcpanel.local`
- Kodeord: `admin123`  
➡️ Skift kodeord efter første login!

---

### 🇳🇴 Norsk – Kort veiledning & feilsøking

**Hva er CrumbPanel?**  
CrumbPanel er et webpanel for å administrere Minecraft-servere i nettleseren (start/stop, konsoll, plugins, automatisering, innstillinger osv.).

**Starte etter installasjon**

```bash
cd ~/crumbpanel
docker compose up -d
```

I nettleseren:

- Panel: `http://DIN-IP:8437` eller `http://localhost:8437`
- API: `http://DIN-IP:5829/api`

**Standard pålogging**

- E‑post: `admin@mcpanel.local`
- Passord: `admin123`  
➡️ Bytt passord etter første innlogging!

---

### 🇵🇹 Português – Guia rápido & resolução de problemas

**O que é o CrumbPanel?**  
CrumbPanel é um painel web para gerir servidores de Minecraft (iniciar/parar, consola, plugins, automações, definições, etc.).

**Iniciar após a instalação**

```bash
cd ~/crumbpanel
docker compose up -d
```

No navegador:

- Painel: `http://O-TEU-IP:8437` ou `http://localhost:8437`
- API: `http://O-TEU-IP:5829/api`

**Login padrão**

- Email: `admin@mcpanel.local`
- Senha: `admin123`  
➡️ Muda a senha depois do primeiro login!

**Problemas comuns**

- Verificar contêineres e logs:
  ```bash
  docker compose ps
  docker compose logs -f
  ```

---

