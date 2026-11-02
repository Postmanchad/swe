import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import courseRoutes from './routes/courses.js';
import assignmentRoutes from './routes/assignments.js';
import goalRoutes from './routes/goals.js';
import taskRoutes from './routes/tasks.js';
import intentionRoutes from './routes/intentions.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRoutes);
  app.use('/events', eventRoutes);
  app.use('/courses', courseRoutes);
  app.use('/assignments', assignmentRoutes);
  app.use('/goals', goalRoutes);
  app.use('/tasks', taskRoutes);
  app.use('/intentions', intentionRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
  return app;
}
