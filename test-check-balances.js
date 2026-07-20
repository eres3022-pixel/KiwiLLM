import { pgPool } from './server/db.js';

async function run() {
  try {
    const usage = await pgPool.query('SELECT * FROM daily_usage');
    console.log("Daily Usage:", usage.rows);
    
    const workspaces = await pgPool.query('SELECT id, credit_balance, credit_usd_balance FROM workspaces');
    console.log("Workspaces:", workspaces.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
