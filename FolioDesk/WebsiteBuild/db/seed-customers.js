import mysql from "mysql2/promise";

async function seedCustomers() {
  const conn = await mysql.createConnection("mysql://root:root@127.0.0.1:3306/foliodesk");
  console.log("Connected to MySQL for seeding customer onboardings...");

  // 1. Create table if not exists
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS onboarded_customers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      affiliate_id BIGINT UNSIGNED NOT NULL,
      customer_name VARCHAR(180) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NULL,
      package_name VARCHAR(150) NOT NULL,
      package_count INT UNSIGNED NOT NULL DEFAULT 1,
      annual_value_myr DECIMAL(12,2) NOT NULL DEFAULT 60000.00,
      signed_date DATE NOT NULL,
      status ENUM('SIGNED','ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE,
      INDEX idx_customer_affiliate (affiliate_id)
    )
  `);

  // Clear existing customer seed data
  await conn.execute("TRUNCATE TABLE onboarded_customers");

  // Fetch all affiliate codes to map code -> affiliate_id
  const [apps] = await conn.execute("SELECT id, affiliate_code, legal_name FROM affiliate_applications");
  const codeToId = new Map();
  apps.forEach((a) => {
    if (a.affiliate_code) codeToId.set(a.affiliate_code, a.id);
  });

  const customerData = [
    // APEX ENGINEERING (APEXENG99) - 3 Customers
    {
      code: "APEXENG99",
      customer_name: "Genting Highlands Heavy Construction Sdn Bhd",
      customer_email: "contracts@gentingconst.my",
      customer_phone: "+60128899001",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 2,
      annual_value_myr: 120000.00,
      signed_date: "2026-06-14",
      status: "ACTIVE",
    },
    {
      code: "APEXENG99",
      customer_name: "Sime Darby Industrial Partner",
      customer_email: "procurement@simedarbyind.my",
      customer_phone: "+60127711223",
      package_name: "Master Tenant License (Multi-Entity)",
      package_count: 1,
      annual_value_myr: 120000.00,
      signed_date: "2026-07-02",
      status: "ACTIVE",
    },
    {
      code: "APEXENG99",
      customer_name: "Gamuda Infra Subcontracting Division",
      customer_email: "infra@gamuda-sub.my",
      customer_phone: "+60193344556",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 3,
      annual_value_myr: 180000.00,
      signed_date: "2026-07-28",
      status: "SIGNED",
    },

    // BINA TECH INFRA (BINATECH88) - 4 Customers
    {
      code: "BINATECH88",
      customer_name: "Surbana Jurong Modular Infra Pte Ltd",
      customer_email: "modular@surbanajurong.sg",
      customer_phone: "+6568910022",
      package_name: "Master Tenant License (Multi-Entity)",
      package_count: 1,
      annual_value_myr: 120000.00,
      signed_date: "2026-06-20",
      status: "ACTIVE",
    },
    {
      code: "BINATECH88",
      customer_name: "Keppel Offshore & Marine Engineering",
      customer_email: "marine@keppeloffshore.sg",
      customer_phone: "+6567723344",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 2,
      annual_value_myr: 120000.00,
      signed_date: "2026-07-11",
      status: "ACTIVE",
    },
    {
      code: "BINATECH88",
      customer_name: "Sembcorp Specialised Piping Systems",
      customer_email: "piping@sembcorp.sg",
      customer_phone: "+6565548899",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 1,
      annual_value_myr: 60000.00,
      signed_date: "2026-08-02",
      status: "ACTIVE",
    },
    {
      code: "BINATECH88",
      customer_name: "Woh Hup Heavy Contractors Pte Ltd",
      customer_email: "tenders@wohhup.sg",
      customer_phone: "+6564412233",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 4,
      annual_value_myr: 240000.00,
      signed_date: "2026-08-05",
      status: "SIGNED",
    },

    // NANYANG HEAVY INDUSTRIES (NANYANG77) - 3 Customers
    {
      code: "NANYANG77",
      customer_name: "Johor Port Logistics Hub Project",
      customer_email: "logistics@johorport.com.my",
      customer_phone: "+60178822334",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 2,
      annual_value_myr: 120000.00,
      signed_date: "2026-05-18",
      status: "ACTIVE",
    },
    {
      code: "NANYANG77",
      customer_name: "MMC Corporation Sub-Vendor Network",
      customer_email: "vendor@mmccorp.my",
      customer_phone: "+60134455667",
      package_name: "Master Tenant License (Multi-Entity)",
      package_count: 1,
      annual_value_myr: 120000.00,
      signed_date: "2026-06-30",
      status: "ACTIVE",
    },
    {
      code: "NANYANG77",
      customer_name: "Pengerang Petroleum Engineering",
      customer_email: "eng@pengerangpetro.my",
      customer_phone: "+60198877665",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 3,
      annual_value_myr: 180000.00,
      signed_date: "2026-07-19",
      status: "ACTIVE",
    },

    // SYNERGY M&E SOLUTIONS (SYNME0001) - 2 Customers
    {
      code: "SYNME0001",
      customer_name: "Sunway MEP Subcontractor Services",
      customer_email: "mep@sunwayconst.my",
      customer_phone: "+60129988776",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 1,
      annual_value_myr: 60000.00,
      signed_date: "2026-07-08",
      status: "ACTIVE",
    },
    {
      code: "SYNME0001",
      customer_name: "IJM Construction Partner Division",
      customer_email: "partner@ijm.my",
      customer_phone: "+60136655443",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 2,
      annual_value_myr: 120000.00,
      signed_date: "2026-07-25",
      status: "SIGNED",
    },

    // LION CITY POWER & GRID (LIONGRID1) - 1 Customer
    {
      code: "LIONGRID1",
      customer_name: "SP Group Substation Automation Partner",
      customer_email: "substation@spgroup.sg",
      customer_phone: "+6563321144",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 1,
      annual_value_myr: 60000.00,
      signed_date: "2026-07-14",
      status: "ACTIVE",
    },

    // SOUTHERN RAILWAY SYSTEMS (SOUTHRAIL) - 1 Customer
    {
      code: "SOUTHRAIL",
      customer_name: "RTS Link Rail Contractors",
      customer_email: "rail@rtslink.my",
      customer_phone: "+60172233445",
      package_name: "Standard Tenant 5-User Operating Block",
      package_count: 2,
      annual_value_myr: 120000.00,
      signed_date: "2026-07-22",
      status: "ACTIVE",
    },
  ];

  for (const item of customerData) {
    const affiliateId = codeToId.get(item.code);
    if (!affiliateId) {
      console.warn(`Affiliate code ${item.code} not found in database, skipping.`);
      continue;
    }

    await conn.execute(
      `INSERT INTO onboarded_customers 
       (affiliate_id, customer_name, customer_email, customer_phone, package_name, package_count, annual_value_myr, signed_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        affiliateId,
        item.customer_name,
        item.customer_email,
        item.customer_phone,
        item.package_name,
        item.package_count,
        item.annual_value_myr,
        item.signed_date,
        item.status,
      ]
    );

    console.log(`Seeded Customer: ${item.customer_name} -> Affiliate ID: ${item.code}`);
  }

  await conn.end();
  console.log("Customer onboarding seeding complete!");
}

seedCustomers().catch((err) => {
  console.error("Customer seeding failed:", err);
  process.exit(1);
});
