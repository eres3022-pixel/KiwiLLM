const testReasoning = async () => {
  const baseUrl = 'https://api.hcnsec.cn';
  const apiKey = 'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl';

  console.log('Testing DeepSeek-V4-Pro for reasoning content...');
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'DeepSeek-V4-Pro',
      messages: [{ role: 'user', content: 'Which is bigger: 9.11 or 9.9?' }]
    })
  });
  const data = await res.json();
  console.log('RESPONSE MESSAGE OBJECT:');
  console.log(JSON.stringify(data.choices?.[0]?.message, null, 2));
};
testReasoning();
