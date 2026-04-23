import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import authRoutes from '../server/src/routes/auth.js';
import workspaceRoutes from '../server/src/routes/workspace.js';
import memberRoutes from '../server/src/routes/members.js';
import projectRoutes from '../server/src/routes/projects.js';
import taskRoutes from '../server/src/routes/tasks.js';
import sprintRoutes from '../server/src/routes/sprints.js';
import notificationRoutes from '../server/src/routes/notifications.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
