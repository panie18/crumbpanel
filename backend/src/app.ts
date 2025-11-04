import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import serverRoutes from './routes/serverRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/servers', serverRoutes);

export default app;
