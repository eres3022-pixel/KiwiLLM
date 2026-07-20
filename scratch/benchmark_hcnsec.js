const benchmark = async () => {
  const baseUrl = 'https://api.hcnsec.cn';
  const apiKey = 'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl';

  const modelsRes = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await modelsRes.json();
  const models = data.data ? data.data.map(m => m.id) : [];

  console.log(`Starting benchmark for ${models.length} models...\n`);
  const results = [];

  for (const model of models) {
    const start = performance.now();
    try {
      const chatRes = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 15
        })
      });
      const end = performance.now();
      const latencyMs = Math.round(end - start);
      const json = await chatRes.json().catch(() => null);

      if (chatRes.ok && json && json.choices && json.choices.length > 0) {
        const text = (json.choices[0].message?.content || '').replace(/\n/g, ' ').slice(0, 30);
        results.push({ model, status: 'Success (200)', latencyMs, sample: text });
        console.log(`[${model}] - ${latencyMs}ms - OK: "${text}"`);
      } else {
        const errMsg = json?.error?.message || json?.message || `HTTP ${chatRes.status}`;
        results.push({ model, status: `Failed (${chatRes.status})`, latencyMs, sample: errMsg.slice(0, 40) });
        console.log(`[${model}] - ${latencyMs}ms - FAIL: ${errMsg}`);
      }
    } catch (err) {
      const end = performance.now();
      const latencyMs = Math.round(end - start);
      results.push({ model, status: 'Error', latencyMs, sample: err.message });
      console.log(`[${model}] - ${latencyMs}ms - ERROR: ${err.message}`);
    }
  }

  console.log('\n--- FINAL RESULTS JSON ---');
  console.log(JSON.stringify(results, null, 2));
};

benchmark();
