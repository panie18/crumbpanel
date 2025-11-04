# 🎮 CrumbPanel

A modern, fully functional Minecraft Server Management Panel with Glassmorphism UI, Docker support, and real-time console.

**Made by [paulify.dev](https://paulify.eu) 🚀**

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

- 🖥️ **Server Dashboard** - Overview of all Minecraft instances
- 📊 **Live Monitoring** - CPU, RAM, TPS, player count in real-time
- 🎮 **Player Management** - Kick, Ban, Whitelist
- 📁 **File Management** - Upload, Download, Edit
- 💾 **Backup & Restore** - Automatic and manual backups
- ☁️ **Cloud Backups** - WebDAV integration (Nextcloud, ownCloud, etc.)
- 🔐 **Security** - JWT Auth, RBAC, encrypted RCON passwords
- 🌐 **Multilingual** - English & German
- 🎨 **Glassmorphism UI** - Modern, animated user interface

## 🚀 Quick Start

### Automatic Installation

```bash
curl -fsSL https://raw.githubusercontent.com/panie18/crumbpanel/main/install.sh | bash
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/panie18/crumbpanel.git
cd crumbpanel

# Create .env file (see .env.example)
cp .env.example .env

# Start Docker containers
docker-compose up -d --build
```

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

