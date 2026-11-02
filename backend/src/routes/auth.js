import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the email is unknown, so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at });

router.post('/register', wrap(async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const name = req.body?.name ? String(req.body.name).trim().slice(0, 100) : null;

  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'A valid email is required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (Buffer.byteLength(password) > 72) return res.status(400).json({ error: 'Password must be at most 72 bytes' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hash, name],
    );
    res.status(201).json({ token: signToken(rows[0].id), user: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
    throw err;
  }
}));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Incorrect email or password' });

  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'Account no longer exists' });
  res.json({ user: publicUser(rows[0]) });
}));

export default router;
