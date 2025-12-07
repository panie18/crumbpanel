# 👤 Benutzerhandbuch

## Dashboard-Übersicht

Nach dem Login siehst du das Hauptdashboard mit folgenden Bereichen:

### Hauptnavigation

- **Dashboard** - Übersicht aller Server
- **Server** - Server-Verwaltung
- **Plugins** - Plugin-Marktplatz
- **Backups** - Backup-Verwaltung
- **Settings** - Panel-Einstellungen
- **Profile** - Dein Benutzerprofil

### Dashboard-Kacheln

1. **Server-Status** - Anzahl laufender/gestoppter Server
2. **Ressourcen** - RAM/CPU-Auslastung
3. **Spieler online** - Aktuelle Spieleranzahl
4. **Letzte Aktivität** - Neueste Events

## Benutzerverwaltung

### Neuen Benutzer erstellen

1. Gehe zu **Settings → Users**
2. Klicke auf **"Add User"**
3. Fülle das Formular aus:
   - **Username**: Eindeutiger Benutzername
   - **Email**: E-Mail-Adresse
   - **Password**: Sicheres Passwort (mind. 8 Zeichen)
   - **Role**: Admin, Moderator oder User
4. Klicke **"Create User"**

### Benutzerrollen

#### Admin
- Voller Zugriff auf alle Funktionen
- Kann Benutzer verwalten
- Kann alle Server verwalten
- Zugriff auf System-Einstellungen

#### Moderator
- Kann Server starten/stoppen
- Kann Konsole benutzen
- Kann Plugins installieren
- **Kein** Zugriff auf Benutzer-Verwaltung

#### User
- Kann nur zugewiesene Server sehen
- Kann Server starten/stoppen
- Kann Konsole benutzen
- **Keine** Admin-Rechte

### Benutzer bearbeiten

1. Gehe zu **Settings → Users**
2. Klicke auf den Benutzer
3. Bearbeite die Felder
4. Speichere mit **"Update User"**

### Benutzer löschen

1. Gehe zu **Settings → Users**
2. Klicke auf das **Mülleimer-Symbol** beim Benutzer
3. Bestätige mit **"Delete"**

⚠️ **Achtung:** Der Admin-Benutzer kann nicht gelöscht werden!

## Profil-Einstellungen

### Profil bearbeiten

1. Klicke oben rechts auf dein **Profilbild**
2. Wähle **"Profile Settings"**
3. Bearbeite:
   - Display Name
   - Email
   - Avatar
4. Speichere mit **"Save Changes"**

### Passwort ändern

1. Gehe zu **Profile → Security**
2. Gib dein **aktuelles Passwort** ein
3. Gib das **neue Passwort** ein (zweimal)
4. Klicke **"Change Password"**

### 2FA aktivieren

1. Gehe zu **Profile → Security**
2. Klicke **"Enable Two-Factor Authentication"**
3. Scanne den QR-Code mit deiner Authenticator-App
4. Gib den 6-stelligen Code ein
5. Speichere die **Backup-Codes** sicher!

#### Unterstützte Authenticator-Apps

- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password
- Bitwarden

### 2FA deaktivieren

1. Gehe zu **Profile → Security**
2. Klicke **"Disable Two-Factor Authentication"**
3. Bestätige mit deinem Passwort

## Benachrichtigungen

### Benachrichtigungs-Einstellungen

1. Gehe zu **Settings → Notifications**
2. Aktiviere/Deaktiviere:
   - Server gestartet/gestoppt
   - Server abgestürzt
   - Backup abgeschlossen
   - Neue Updates verfügbar
   - Hohe Ressourcen-Auslastung

### E-Mail-Benachrichtigungen

Konfiguriere in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine-email@gmail.com
SMTP_PASS=dein-app-passwort
SMTP_FROM=noreply@crumbpanel.local
```

## Dark/Light Mode

Wechsel zwischen Dark und Light Mode:

1. Klicke oben rechts auf das **Mond/Sonnen-Symbol**
2. Oder: **Settings → Appearance → Theme**

Der gewählte Modus wird gespeichert.

---

[⬅️ Zurück zu Installation](./01-getting-started.md) | [➡️ Weiter zu Server-Verwaltung](./03-server-management.md)
