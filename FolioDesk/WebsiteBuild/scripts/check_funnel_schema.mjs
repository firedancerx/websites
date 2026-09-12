import mysql from 'mysql2/promise';

async function checkSchema() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [columns] = await connection.execute("DESCRIBE deal_funnel_steps");
  console.log("=== deal_funnel_steps Schema ===");
  console.table(columns);

  await connection.end();
}

checkSchema().catch(console.error);
