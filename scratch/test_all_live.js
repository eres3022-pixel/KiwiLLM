const testAll = async () => {
  const urls = [
    'https://kiwillm.in',
    'https://www.kiwillm.in',
    'https://app.kiwillm.in',
    'https://api.kiwillm.in/api/health'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url} -> STATUS: ${res.status}`);
    } catch (err) {
      console.log(`URL: ${url} -> ERROR: ${err.message}`);
    }
  }
};
testAll();
