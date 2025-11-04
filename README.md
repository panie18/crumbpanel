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

