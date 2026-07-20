import fs from 'fs';
const key = 'Kiwi_459fc5539e0f433b884d9ad94a0e';

async function testReasoning() {
  const res = await fetch('https://api.kiwillm.in/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'DeepSeek-V4-Pro', messages: [{role: 'user', content: 'What is 2+2?'}] })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
testReasoning();
