import { pgPool } from './server/db.js';

async function check() {
  try {
    const res = await pgPool.query('SELECT * FROM daily_usage');
    console.log("DB DATA:", res.rows);
  } catch(e) {
    console.log(e);
  } finally {
    if (pgPool) await pgPool.end();
  }
}
check();
