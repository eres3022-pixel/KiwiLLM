import { pgPool } from './server/db.js';

async function check() {
  const result = await pgPool.query('SELECT * FROM daily_usage');
  console.log("Daily Usage:", result.rows);
  const models = await pgPool.query('SELECT * FROM model_usage');
  console.log("Model Usage:", models.rows);
  await pgPool.end();
}
check();
