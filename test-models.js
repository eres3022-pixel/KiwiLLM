const models = ['auto', 'DeepSeek-V4-Flash', 'DeepSeek-V4-Pro', 'glm-4.7', 'glm-5.1'];
const key = 'Kiwi_459fc5539e0f433b884d9ad94a0e';

async function testModels() {
  console.log('Testing models...');
  for (const model of models) {
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
          messages: [{role: 'user', content: 'What model are you? Answer in 1 short sentence.'}]
        })
      });
      const data = await res.json();
      const latency = Date.now() - start;
      if (res.ok) {
        console.log(`✅ ${model} | ${latency}ms | ${data.choices[0].message.content.substring(0, 80).replace(/\n/g, ' ')}...`);
      } else {
        console.log(`❌ ${model} | ${latency}ms | ${JSON.stringify(data.error)}`);
      }
    } catch (e) {
      console.log(`❌ ${model} | Error: ${e.message}`);
    }
  }
}
testModels();
