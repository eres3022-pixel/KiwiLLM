const key = 'Kiwi_dc4ecb8b767b410f877c0d24ebd9';
const models = ['DeepSeek-V4-Flash', 'DeepSeek-V4-Pro'];
const iterations = 4;

async function runTests() {
  console.log(`Starting tests with key ${key.substring(0, 10)}...`);
  for (const model of models) {
    console.log(`\nTesting ${model}:`);
    for (let i = 1; i <= iterations; i++) {
      const start = Date.now();
      try {
        const res = await fetch('https://api.kiwillm.in/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Say hello in exactly one word.' }]
          })
        });
        const time = Date.now() - start;
        const status = res.status;
        
        if (status !== 200) {
          const text = await res.text();
          console.log(`  Run ${i}: Failed! HTTP ${status} - ${time}ms - Error: ${text}`);
          continue;
        }
        
        const data = await res.json();
        const tokens = data.usage?.total_tokens || 0;
        const reply = data.choices?.[0]?.message?.content?.replace(/\n/g, ' ') || 'No content';
        
        console.log(`  Run ${i}: Success! [${time}ms] [${tokens} tokens] - Reply: "${reply}"`);
      } catch (err) {
        console.log(`  Run ${i}: Exception! ${Date.now() - start}ms - ${err.message}`);
      }
    }
  }
}

runTests();
