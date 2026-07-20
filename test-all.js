import fs from 'fs';
const key = 'Kiwi_459fc5539e0f433b884d9ad94a0e';

async function testAll() {
  const res = await fetch('https://api.kiwillm.in/v1/models', { headers: { Authorization: `Bearer ${key}` } });
  const data = await res.json();
  const models = data.data.map(m => m.id);
  const failing = [];
  
  for (const model of models) {
    if (model.includes('audio') || model.includes('image')) continue;
    
    try {
      const res = await fetch('https://api.kiwillm.in/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{role: 'user', content: 'hello'}] }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        console.log(model, '✅');
      } else {
        failing.push(model);
        console.log(model, '❌ HTTP ' + res.status);
      }
    } catch(e) {
      failing.push(model);
      console.log(model, '❌ Timeout/Error');
    }
  }
  console.log('FAILING_MODELS:', failing.join(','));
}
testAll();
