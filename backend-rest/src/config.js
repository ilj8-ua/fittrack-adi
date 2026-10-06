import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'fittrack_jwt_secret_key_adi_2026_super_secure';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'fittrack.db');
