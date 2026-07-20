const testApi = async () => {
  try {
    console.log('Testing /v1/models...');
    const modelsRes = await fetch('https://forge-gateway-api.fly.dev/v1/models', {
      headers: {
        'Authorization': 'Bearer fg-435f6cd63b014a60b40bfab8c4fa6852'
      }
    });
    const modelsData = await modelsRes.json();
    console.log('MODELS STATUS:', modelsRes.status);
    console.log('MODELS:', modelsData.data ? modelsData.data.slice(0, 3).map(m => m.id) : modelsData);

    console.log('\nTesting /v1/chat/completions...');
    const chatRes = await fetch('https://forge-gateway-api.fly.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fg-435f6cd63b014a60b40bfab8c4fa6852',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelsData.data && modelsData.data.length > 0 ? modelsData.data[0].id : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "Forge Gateway Working!"' }]
      })
    });
    const chatText = await chatRes.text();
    console.log('CHAT STATUS:', chatRes.status);
    console.log('CHAT RESPONSE:', chatText);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
testApi();
