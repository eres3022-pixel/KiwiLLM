import { recordPgUsage, pgPool } from './server/db.js';

async function test() {
  try {
    const key = {
      workspace_id: 'default',
      id: 'test_key',
    };
    await recordPgUsage({
      key,
      model: 'DeepSeek-V4-Pro',
      endpoint: '/v1/chat/completions',
      usage: { inputTokens: 23, outputTokens: 28, totalTokens: 51 },
      statusCode: 200
    });
    console.log("SUCCESS!");
  } catch(e) {
    console.log("FAILED:", e.message);
  } finally {
    if (pgPool) await pgPool.end();
  }
}
test();
