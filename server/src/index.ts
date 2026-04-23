import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspace.js';
import memberRoutes from './routes/members.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import sprintRoutes from './routes/sprints.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Local dev: start server ────────────────────────────
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export { app };
export default app;
