import { pgPool, flushPgUsage, recordPgUsage } from './server/db.js';

async function testFlush() {
  if (!pgPool) return console.log("No DB");
  
  const event = {
    key: {
      id: 'd25ec49e-eb38-492d-9816-ef8b9563ae3a',
      workspace_id: 'ae412039-aaa5-4d5b-ac29-bdad67953b73'
    },
    model: 'DeepSeek-V4-Flash',
    endpoint: '/v1/chat/completions',
    usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    statusCode: 200
  };
  
  console.log("Recording usage...");
  await recordPgUsage(event);
  console.log("Flushing queue...");
  
  const originalError = console.error;
  let errMessage = null;
  console.error = (msg, e) => {
    errMessage = `${msg} ${e}`;
    originalError(msg, e);
  };
  
  await flushPgUsage();
  
  if (errMessage) {
    console.log("FLUSH FAILED:", errMessage);
  } else {
    console.log("FLUSH SUCCESS");
  }
  
  await pgPool.end();
}

testFlush();
