import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) process.env[key.trim()] = value.trim();
});

import { pgPool } from './server/db.js';

if (!pgPool) {
  console.log('pgPool is null');
  process.exit(1);
}

pgPool.query('select 1')
  .then(() => console.log('DB SUCCESS'))
  .catch(err => {
    console.error('DB ERROR:', err.message);
    if (err.code) console.error('CODE:', err.code);
  })
  .finally(() => pgPool.end());
