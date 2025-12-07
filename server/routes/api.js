const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const serverController = require('../controllers/serverController');
const authController = require('../controllers/authController');
const modController = require('../controllers/modController');

// Server Routes
router.post('/servers', authMiddleware, serverController.createServer);

// Mod Routes
router.get('/mods', authMiddleware, modController.getMods);
router.post('/mods/install', authMiddleware, modController.installMod);

// Auth Routes (2FA & FIDO2)
router.post('/auth/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/auth/2fa/verify', authMiddleware, authController.verify2FA);
router.get('/auth/fido2/challenge', authMiddleware, authController.generateFidoChallenge);
router.post('/auth/fido2/register', authMiddleware, authController.verifyFidoRegistration);

module.exports = router;