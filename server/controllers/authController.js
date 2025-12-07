const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// 2FA Setup
exports.setup2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ name: `CrumbPanel (${req.user.email})` });
        
        // Save secret.base32 to user in DB temporarily or permanently depending on flow
        await db.User.update({ tempTwoFactorSecret: secret.base32 }, { where: { id: req.user.id } });

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ message: 'Error generating QR code' });
            res.json({ secret: secret.base32, qrCode: data_url });
        });
    } catch (error) {
        res.status(500).json({ message: '2FA setup failed' });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await db.User.findByPk(req.user.id);
        
        // Use temp secret for initial verification, or actual secret if already enabled
        const secret = user.tempTwoFactorSecret || user.twoFactorSecret;

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // If verifying for the first time, confirm 2FA is enabled
            if (user.tempTwoFactorSecret) {
                await user.update({ 
                    twoFactorEnabled: true, 
                    twoFactorSecret: user.tempTwoFactorSecret, 
                    tempTwoFactorSecret: null 
                });
            }
            res.json({ message: '2FA verified successfully' });
        } else {
            res.status(400).json({ message: 'Invalid token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Verification failed' });
    }
};

// FIDO2 / WebAuthn (Simplified placeholder - requires @simplewebauthn/server)
exports.generateFidoChallenge = async (req, res) => {
    // Generate challenge logic here
    res.json({ challenge: 'mock-challenge-string', rp: { name: 'CrumbPanel' }, user: { id: req.user.id, name: req.user.email, displayName: req.user.username }, pubKeyCredParams: [{ alg: -7, type: 'public-key' }] });
};

exports.verifyFidoRegistration = async (req, res) => {
    // Verify attestation logic here
    res.json({ verified: true });
};