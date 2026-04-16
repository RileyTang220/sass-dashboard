import type { VercelRequest, VercelResponse } from '@vercel/node';
import appModule from '../server/src/index.js';

// Handle ESM/CJS interop — the import may be { default: app } or app directly
const app = typeof appModule === 'function' ? appModule : (appModule as any).default;

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
