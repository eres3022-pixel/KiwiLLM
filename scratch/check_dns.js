import dns from 'node:dns/promises';

const checkDns = async () => {
  try {
    console.log('Resolving TXT for _vercel.kiwillm.in...');
    const records = await dns.resolveTxt('_vercel.kiwillm.in');
    console.log('TXT RECORDS FOUND:', records.map(r => r.join('')));
  } catch (err) {
    console.error('DNS LOOKUP ERROR:', err.message);
  }
};
checkDns();
