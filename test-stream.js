import fs from 'fs';
const key = 'Kiwi_459fc5539e0f433b884d9ad94a0e';

async function testStream() {
  const start = Date.now();
  const res = await fetch('http://localhost:3000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'DeepSeek-V4-Pro', stream: true, messages: [{role: 'user', content: 'Count from 1 to 5'}] })
  });
  
  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      console.log(`[+${Date.now() - start}ms] ${text.substring(0, 50).replace(/\n/g, ' ')}...`);
    }
  }
}
testStream();
