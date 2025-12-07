import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create storage directory if it doesn't exist
const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    console.log('Created storage directory');
}

// Create empty SQLite database file if it doesn't exist
const dbPath = path.join(storageDir, 'lucid-dev.db');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    console.log('Created empty SQLite database file');
}

console.log('Database initialization complete!');