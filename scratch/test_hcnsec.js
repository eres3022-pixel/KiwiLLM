const testApi = async () => {
  try {
    const baseUrl = 'https://api.hcnsec.cn';
    const apiKey = 'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl';

    console.log('Testing /v1/models on', baseUrl);
    const modelsRes = await fetch(`${baseUrl}/v1/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('MODELS STATUS:', modelsRes.status);
    const modelsData = await modelsRes.json();
    console.log('MODELS DATA (first 5):', Array.isArray(modelsData.data) ? modelsData.data.slice(0, 5) : modelsData);

    const modelToUse = Array.isArray(modelsData.data) && modelsData.data.length > 0 ? modelsData.data[0].id : 'gpt-3.5-turbo';
    console.log('\nTesting /v1/chat/completions with model:', modelToUse);
    const chatRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: 'user', content: 'Hi, respond with OK if working' }]
      })
    });
    console.log('CHAT STATUS:', chatRes.status);
    const chatData = await chatRes.json();
    console.log('CHAT RESPONSE:', JSON.stringify(chatData, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
testApi();
