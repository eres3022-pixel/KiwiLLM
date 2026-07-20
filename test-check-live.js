import pg from 'pg';

const url = 'postgresql://postgres.lghwozkpsuteevkubysb:eres9325296264@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: url });

async function check() {
  try {
    const keys = await pool.query('SELECT id, workspace_id, key_preview FROM api_keys');
    console.log("API Keys:", keys.rows);

    const workspaces = await pool.query('SELECT id, email, name FROM workspaces');
    console.log("Workspaces:", workspaces.rows);

    const usage = await pool.query('SELECT * FROM daily_usage');
    console.log("Daily Usage:", usage.rows);

    const modelUsage = await pool.query('SELECT * FROM model_usage');
    console.log("Model Usage:", modelUsage.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
