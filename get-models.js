const key = 'Kiwi_459fc5539e0f433b884d9ad94a0e';
async function run() {
  const res = await fetch('https://api.kiwillm.in/v1/models', {
    headers: { Authorization: `Bearer ${key}` }
  });
  const data = await res.json();
  if (data.data) {
    const models = data.data.map(m => m.id);
    console.log("TOTAL MODELS: " + models.length);
    console.log(models.join(", "));
  } else {
    console.log("FAILED:", data);
  }
}
run();
