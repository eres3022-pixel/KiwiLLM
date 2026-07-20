const listModels = async () => {
  try {
    const res = await fetch('https://forge-gateway-api.fly.dev/v1/models', {
      headers: {
        'Authorization': 'Bearer fg-435f6cd63b014a60b40bfab8c4fa6852'
      }
    });
    const data = await res.json();
    if (data.data) {
      console.log('--- MODEL LIST ---');
      data.data.forEach((m, i) => console.log(`${i + 1}. ${m.id}`));
    } else {
      console.log('Unexpected response:', data);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
listModels();
