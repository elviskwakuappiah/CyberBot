import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'users.json');

// Security: JWT_SECRET should NEVER be hardcoded in production.
// It must be set as an environment variable in your deployment platform (e.g., Cloudflare Workers, AI Studio).
// Security: JWT_SECRET should ideally be set in settings.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: JWT_SECRET not set. Authentication will use a temporary secret.');
    return 'dev-secret-key-fallback-12345';
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

// Ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required for secure cookies behind reverse proxies (like Cloud Run)
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(cookieParser());

  // Logging middleware for debugging (only in development or if needed)
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${req.method} ${req.path}`);
    }
    next();
  });

  // API Routes
  app.post('/api/auth/signup', async (req: any, res: any, next: any) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

      const users = getUsers();
      if (users.find((u: any) => u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { 
        id: Date.now().toString(), 
        username, 
        email: email || '',
        password: hashedPassword,
        twoFactorEnabled: false 
      };
      users.push(newUser);
      saveUsers(users);

      const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true, // required for sameSite: 'none' in iframes
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ user: { id: newUser.id, username: newUser.username, twoFactorEnabled: newUser.twoFactorEnabled } });
    } catch (e) {
      console.error('Signup Error:', e);
      next(e);
    }
  });

  app.post('/api/auth/login', async (req: any, res: any, next: any) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

      const users = getUsers();
      const user = users.find((u: any) => u.username === username);

      if (!user) {
        return res.status(401).json({ error: 'Account not found' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      if (user.twoFactorEnabled) {
        return res.json({ twoFactorRequired: true, userId: user.id });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ user: { id: user.id, username: user.username, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (e) {
      console.error('Login Error:', e);
      next(e);
    }
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    const users = getUsers();
    const user = users.find((u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username,
        twoFactorEnabled: user.twoFactorEnabled 
      } 
    });
  });

  app.post('/api/auth/2fa/toggle', authenticate, (req: any, res) => {
    const users = getUsers();
    const userIndex = users.findIndex((u: any) => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    users[userIndex].twoFactorEnabled = !users[userIndex].twoFactorEnabled;
    saveUsers(users);

    res.json({ 
      success: true, 
      twoFactorEnabled: users[userIndex].twoFactorEnabled 
    });
  });

  app.post('/api/auth/2fa/verify', async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) return res.status(400).json({ error: 'Missing fields' });

      const users = getUsers();
      const user = users.find((u: any) => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (code !== '123456') {
        return res.status(401).json({ error: 'Invalid 2FA code. Hint: Use 123456' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ user: { id: user.id, username: user.username, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (e) {
      next(e);
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  app.delete('/api/auth/delete', authenticate, (req: any, res) => {
    const users = getUsers();
    const newUsers = users.filter((u: any) => u.id !== req.user.id);
    saveUsers(newUsers);
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Internal Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message || 'An unexpected error occurred on the server.' 
    });
  });

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
