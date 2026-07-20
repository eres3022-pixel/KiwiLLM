const listModels = async () => {
  const baseUrl = 'https://api.hcnsec.cn';
  const apiKey = 'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl';
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log('TOTAL MODELS:', data.data ? data.data.length : 0);
  if (data.data) {
    data.data.forEach((m, i) => console.log(`${i+1}. ${m.id}`));
  }
};
listModels();
