const testRoot = async () => {
  try {
    const res = await fetch('https://kiwillm.in');
    console.log('https://kiwillm.in STATUS:', res.status);
  } catch (err) {
    console.log('https://kiwillm.in ERROR:', err.message);
  }
};
testRoot();
