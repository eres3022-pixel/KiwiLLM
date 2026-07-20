import { pgPool } from './server/db.js';

async function run() {
  try {
    const daily = await pgPool.query('SELECT * FROM daily_usage');
    console.log("Daily Usage:", daily.rows);
    
    const model = await pgPool.query('SELECT * FROM model_usage');
    console.log("Model Usage:", model.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
