import fs from 'fs';
import mysql from 'mysql2/promise';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

async function check() {
  const conn = await mysql.createConnection(env.DATABASE_URL);
  const tables = ['deal_collections', 'deal_pipeline', 'payment_advices', 'payout_batches', 'affiliate_applications', 'deal_funnel_steps', 'affiliate_profile_updates'];

  for (const t of tables) {
    try {
      const [cols] = await conn.execute('DESCRIBE ' + t);
      const hasIsTest = cols.some(c => c.Field === 'is_test');
      console.log('Table ' + t + ' has is_test:', hasIsTest);
    } catch (err) {
      console.log('Table ' + t + ' error:', err.message);
    }
  }
  await conn.end();
}
check();
