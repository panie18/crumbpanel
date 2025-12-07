// Change default port to 80 for cleaner URL (requires admin/root privileges on some systems)
const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Access at: http://localhost or http://crumbpanel.local`);
});

const cors = require('cors');
const os = require('os');

// --- AUTOMATISCHE DOMAIN (mDNS) ---
// Damit das funktioniert: npm install multicast-dns
try {
    const mdns = require('multicast-dns')();

    // Funktion um die eigene IP im Netzwerk zu finden
    const getLocalIP = () => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Wir suchen eine IPv4 Adresse, die nicht intern (localhost) ist
                if (!iface.internal && iface.family === 'IPv4') {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    };

    const localIP = getLocalIP();

    // Auf DNS-Anfragen im Netzwerk hören
    mdns.on('query', (query) => {
        // Wenn jemand nach "crumbpanel.local" fragt...
        if (query.questions.some(q => q.name === 'crumbpanel.local')) {
            // ...antworten wir mit unserer IP-Adresse
            mdns.respond({
                answers: [{
                    name: 'crumbpanel.local',
                    type: 'A',
                    ttl: 300,
                    data: localIP
                }]
            });
        }
    });
    console.log(`Local DNS aktiv! Erreichbar unter: http://crumbpanel.local`);
} catch (e) {
    console.log('Konnte mDNS nicht starten (evtl. fehlt "npm install multicast-dns" oder Port 5353 ist belegt).');
}
// ----------------------------------

const app = express();