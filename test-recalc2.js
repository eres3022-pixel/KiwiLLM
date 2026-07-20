import { pgPool } from './server/db.js';

async function run() {
  try {
    // Fix daily_usage usd_estimate
    await pgPool.query(`
      UPDATE daily_usage
      SET usd_estimate = credits_used / 50
      WHERE usd_estimate = 0 AND credits_used > 0;
    `);

    // Fix model_usage usd_estimate
    await pgPool.query(`
      UPDATE model_usage
      SET usd_estimate = credits_used / 50
      WHERE usd_estimate = 0 AND credits_used > 0;
    `);

    // Recalculate workspaces based on fixed usd_estimate
    const result = await pgPool.query(`
      WITH usage_sums AS (
        SELECT workspace_id, SUM(usd_estimate) as total_usd, SUM(credits_used) as total_credits
        FROM daily_usage
        GROUP BY workspace_id
      )
      UPDATE workspaces w
      SET credit_usd_balance = 20.00 - COALESCE(u.total_usd, 0),
          credit_balance = 1000 - COALESCE(u.total_credits, 0)
      FROM usage_sums u
      WHERE w.id = u.workspace_id;
    `);
    console.log("Recalculation complete. Rows updated:", result.rowCount);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
