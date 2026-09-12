import mysql from 'mysql2/promise';

async function checkDeals() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [actualDeals] = await connection.execute("SELECT id, deal_code, customer_name, status, is_test, invoice_number FROM deal_pipeline WHERE is_test = 0");
  console.log("=== ACTUAL Mode Deals (is_test = 0) ===");
  console.table(actualDeals);

  const [actualAffiliates] = await connection.execute(`
    SELECT a.id, a.legal_name, a.is_test,
      (SELECT COUNT(*) FROM deal_pipeline dp WHERE dp.affiliate_id = a.id AND dp.status IN ('LEAD_SUBMITTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONTRACT_SIGNED', 'INVOICED') AND dp.is_test = 0) AS active_prospects_count,
      (SELECT COUNT(*) FROM deal_pipeline dp WHERE dp.affiliate_id = a.id AND dp.status IN ('PARTIAL_COLLECTED', 'FULLY_COLLECTED') AND dp.is_test = 0) AS active_clients_count
    FROM affiliate_applications a
    WHERE a.is_test = 0
  `);
  console.log("\n=== ACTUAL Mode Affiliate Prospects & Clients Check ===");
  console.table(actualAffiliates);

  await connection.end();
}

checkDeals().catch(console.error);
