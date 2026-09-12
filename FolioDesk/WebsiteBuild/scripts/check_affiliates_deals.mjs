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
  const db = await mysql.createConnection(env.DATABASE_URL);

  console.log('=== AFFILIATE APPLICATIONS ===');
  const [affiliates] = await db.execute('SELECT id, user_id, legal_name, affiliate_code, is_test FROM affiliate_applications ORDER BY id ASC');
  console.table(affiliates);

  console.log('\n=== DEAL PIPELINE ===');
  const [deals] = await db.execute('SELECT * FROM deal_pipeline ORDER BY id ASC');
  console.table(deals.map(d => ({ id: d.id, deal_code: d.deal_code, client: d.client_legal_name || d.customer_name || d.prospect_id, affiliate_id: d.affiliate_id, is_test: d.is_test })));

  console.log('\n=== CHECKING QUERY DISCREPANCY FOR EACH DEAL ===');
  for (const d of deals) {
    const [q1] = await db.execute(
      `SELECT d.id, d.deal_code, d.affiliate_id, a.id as aff_id, a.user_id, a.legal_name, a.affiliate_code
       FROM deal_pipeline d
       JOIN affiliate_applications a ON a.id = d.affiliate_id
       WHERE d.id = ?`,
      [d.id]
    );

    const [q2] = await db.execute(
      `SELECT d.id, d.deal_code, d.affiliate_id, a.id as aff_id, a.user_id, a.legal_name, a.affiliate_code
       FROM deal_pipeline d
       JOIN affiliate_applications a ON (a.id = d.affiliate_id OR a.user_id = d.affiliate_id)
       WHERE d.id = ?`,
      [d.id]
    );

    console.log(`\nDeal ID ${d.id} (${d.deal_code}): stored affiliate_id = ${d.affiliate_id}`);
    console.log('  Query 1 (a.id = d.affiliate_id):', q1[0] ? `${q1[0].legal_name} (aff_id=${q1[0].aff_id}, user_id=${q1[0].user_id})` : 'NONE');
    console.log('  Query 2 (a.id = d.affiliate_id OR a.user_id = d.affiliate_id):', q2.map(x => `${x.legal_name} (aff_id=${x.aff_id}, user_id=${x.user_id})`).join(' | '));
  }

  await db.end();
}

check().catch(console.error);
