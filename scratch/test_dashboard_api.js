const testDashApi = async () => {
  try {
    const res = await fetch('https://api.kiwillm.in/api/dashboard');
    console.log('GET https://api.kiwillm.in/api/dashboard -> STATUS:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('RESPONSE:', json);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
};
testDashApi();
