const testDomains = async () => {
  const urls = [
    'https://app.kiwillm.in',
    'https://kiwillm.in',
    'https://www.kiwillm.in',
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
testDomains();
