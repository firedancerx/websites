import mysql from "mysql2/promise";

async function cleanup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const conn = await mysql.createConnection(url);

  console.log("=== Cleaning Up Discrepancies in onboarded_customers ===");

  // Find onboarded_customers records without any approved deal collection
  const [uncollectedRows] = await conn.execute(`
    SELECT oc.id, oc.customer_name, a.legal_name AS affiliate_name
    FROM onboarded_customers oc
    LEFT JOIN affiliate_applications a ON a.id = oc.affiliate_id
    WHERE NOT EXISTS (
      SELECT 1 FROM deal_collections dc 
      JOIN deal_pipeline dp ON dp.id = dc.deal_id 
      WHERE dp.customer_name = oc.customer_name AND dc.approval_status = 'APPROVED'
    )
  `);

  console.log(`Found ${uncollectedRows.length} uncollected mock active client records to remove:`);
  uncollectedRows.forEach((r) => console.log(` - [ID ${r.id}] ${r.affiliate_name} -> ${r.customer_name}`));

  if (uncollectedRows.length > 0) {
    const ids = uncollectedRows.map((r) => r.id);
    await conn.execute(`DELETE FROM onboarded_customers WHERE id IN (${ids.join(",")})`);
    console.log(`✓ Removed ${uncollectedRows.length} mock active client records without billing/collections.`);
  }

  // Check deal_pipeline status for deals with 0 collections that were marked FULLY_COLLECTED
  const [invalidDeals] = await conn.execute(`
    SELECT dp.id, dp.customer_name, dp.status 
    FROM deal_pipeline dp
    WHERE dp.status = 'FULLY_COLLECTED' 
      AND NOT EXISTS (SELECT 1 FROM deal_collections dc WHERE dc.deal_id = dp.id AND dc.approval_status = 'APPROVED')
  `);
  if (invalidDeals.length > 0) {
    console.log(`Found ${invalidDeals.length} fully collected deals with 0 collections. Resetting to CONTRACT_SIGNED...`);
    for (const d of invalidDeals) {
      await conn.execute("UPDATE deal_pipeline SET status='CONTRACT_SIGNED' WHERE id=?", [d.id]);
    }
  }

  await conn.end();
  console.log("=== Cleanup Complete ===");
}

cleanup().catch(console.error);
