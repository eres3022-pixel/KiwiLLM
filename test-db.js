import pg from 'pg';

const url = 'postgresql://postgres.lghwozkpsuteevkubysb:eres9325296264@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: url });

async function test() {
  try {
    console.log("Attempting to connect...");
    const res = await pool.query('SELECT 1 as success');
    console.log("Connected successfully! Result:", res.rows);
  } catch (e) {
    console.error("Connection failed!", e.message);
  } finally {
    await pool.end();
  }
}
test();
