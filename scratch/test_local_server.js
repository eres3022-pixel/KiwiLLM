const testLocal = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/models');
    const data = await res.json();
    console.log('API /api/models STATUS:', res.status);
    console.log('TOTAL MODELS:', data.summary.total);
    console.log('FIRST 3 MODELS:', data.models.slice(0, 3).map(m => m.id));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
testLocal();
