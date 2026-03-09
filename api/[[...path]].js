// Vercel Serverless: catch-all for /api/* so the same Express mock API runs on Vercel.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('../mock-server/server.cjs');

export default (req, res) => app(req, res);
