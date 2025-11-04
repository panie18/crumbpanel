import { Router } from 'express';
import { AuthService } from '../services/authService';

const router = Router();
const auth = new AuthService();

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body ?? {};
  if (!email || !username || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const result = await auth.register(email, username, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message ?? 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const result = await auth.login(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ message: e.message ?? 'Login failed' });
  }
});

export default router;
