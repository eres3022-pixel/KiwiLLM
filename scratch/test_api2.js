const testApi = async () => {
  try {
    const res = await fetch('https://api.ofox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-r2VfBcD2XJ8AG5je6NILsQV8ZIoKgviOIw5YGK04xjKXHGWC',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v3.2',
        messages: [{ role: 'user', content: 'Say hello world' }]
      })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', text);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
testApi();
