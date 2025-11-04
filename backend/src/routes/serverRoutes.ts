import { Router } from 'express';
import { ServerService } from '../services/serverService';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
const service = new ServerService();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const servers = await service.list();
  res.json(servers);
});

router.post('/', async (req, res) => {
  const { name, path, port, rconPort, rconPassword, version, maxRam } = req.body ?? {};
  if (!name || !path || !port || !rconPort || !rconPassword || !version || !maxRam) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const server = await service.create({
    name,
    path,
    port: Number(port),
    rconPort: Number(rconPort),
    rconPassword,
    version,
    maxRam: Number(maxRam)
  });
  res.status(201).json(server);
});

export default router;
