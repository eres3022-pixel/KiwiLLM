import { pgPool } from './server/db.js';

async function run() {
  try {
    console.log("Deleting 'test-model' usage...");
    
    // Delete from model_usage
    const res = await pgPool.query("DELETE FROM model_usage WHERE model = 'test-model'");
    console.log("Rows deleted from model_usage:", res.rowCount);
    
    // Note: We don't need to subtract its totals from daily_usage because 
    // the usd_estimate for test-model was 0 anyway, so it doesn't affect the user's balances.
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
