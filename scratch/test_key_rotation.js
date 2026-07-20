import { getRotatedWorkerApiKey, workerApiKeys } from '../server/config.js';

console.log('Testing Key Rotation for', workerApiKeys.length, 'keys...\n');

for (let i = 1; i <= 10; i++) {
  const key = getRotatedWorkerApiKey();
  console.log(`Request #${i} -> Using Key: ${key.slice(0, 15)}...${key.slice(-4)}`);
}
