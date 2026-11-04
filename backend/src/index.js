import { createApp } from './app.js';

for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable ${name}`);
    process.exit(1);
  }
}

const port = Number(process.env.PORT) || 4000;
createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
