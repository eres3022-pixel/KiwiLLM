import { ensureCoreTables, pgPool } from './server/db.js';

async function run() {
  console.log("Creating tables...");
  await ensureCoreTables();
  console.log("Tables created successfully!");
  
  const tables = await pgPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log("Existing tables:", tables.rows.map(r => r.table_name));
  
  await pgPool.end();
}

run().catch(console.error);
