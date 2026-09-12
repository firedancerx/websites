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
  
  const [tables] = await conn.execute('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  console.log('Database tables:', tableNames);

  for (const t of tableNames) {
    const [cols] = await conn.execute(`DESCRIBE \`${t}\``);
    const fields = cols.map(c => c.Field);
    console.log(`Table ${t}: cols=[${fields.join(', ')}]`);
  }

  await conn.end();
}

check().catch(console.error);
