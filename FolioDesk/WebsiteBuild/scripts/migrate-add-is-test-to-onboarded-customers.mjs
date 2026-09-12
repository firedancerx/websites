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

async function run() {
  const conn = await mysql.createConnection(env.DATABASE_URL);
  try {
    await conn.execute('ALTER TABLE onboarded_customers ADD COLUMN is_test TINYINT NOT NULL DEFAULT 1');
    console.log('✓ Successfully added is_test column to onboarded_customers');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('✓ Column is_test already exists on onboarded_customers');
    } else {
      console.error('Error adding column:', err.message);
    }
  }
  await conn.end();
}

run().catch(console.error);
