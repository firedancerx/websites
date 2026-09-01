import mysql from "mysql2/promise";
import { pbkdf2Sync, randomBytes } from "node:crypto";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha512").toString("hex");
  return `pbkdf2$210000$${salt}$${hash}`;
}

async function seed() {
  const conn = await mysql.createConnection("mysql://root:root@127.0.0.1:3306/foliodesk");
  console.log("Connected to MySQL database...");

  const passwordHash = hashPassword("ABCDefgh1234!@#$");

  const networks = [
    // NETWORK 1: APEX ENGINEERING (5 Downlines)
    {
      root: {
        legalName: "Apex Engineering Holdings Sdn Bhd",
        email: "apex.holdings@apexeng.my",
        applicantType: "COMPANY",
        companyNumber: "201801048821",
        code: "APEXENG99",
        country: "MY",
        currency: "MYR",
        market: "BOTH",
        address1: "Menara Apex, Level 18, Jalan Ampang",
        postcode: "50450",
        town: "Kuala Lumpur",
        state: "Wilayah Persekutuan Kuala Lumpur",
        status: "APPROVED",
      },
      downlines: [
        {
          legalName: "Synergy M&E Solutions Sdn Bhd",
          email: "projects@synergyme.my",
          applicantType: "COMPANY",
          companyNumber: "202001019922",
          code: "SYNME0001",
          uplineCode: "APEXENG99",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "No 45, Jalan Industri PPU 3, Taman Puchong Utama",
          postcode: "47100",
          town: "Puchong",
          state: "Selangor",
          status: "APPROVED",
        },
        {
          legalName: "Klang Valley Piping & Fittings Sdn Bhd",
          email: "info@kvpiping.com.my",
          applicantType: "COMPANY",
          companyNumber: "202103045511",
          code: "KVALLEY01",
          uplineCode: "SYNME0001",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Lot 102, Kawasan Perindustrian Meru",
          postcode: "41050",
          town: "Klang",
          state: "Selangor",
          status: "APPROVED",
        },
        {
          legalName: "Selangor Civil Works Services",
          email: "contracts@selangorcivil.my",
          applicantType: "COMPANY",
          companyNumber: "202201088712",
          code: "SELCIVIL1",
          uplineCode: "SYNME0001",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Unit 8-2, Wisma Civil, Seksyen 13",
          postcode: "40100",
          town: "Shah Alam",
          state: "Selangor",
          status: "CORRECTION_REQUIRED",
        },
        {
          legalName: "Pinnacle Structural Steel Fab",
          email: "sales@pinnaclesteel.my",
          applicantType: "COMPANY",
          companyNumber: "201901033488",
          code: "PINSTEEL1",
          uplineCode: "APEXENG99",
          country: "MY",
          currency: "MYR",
          market: "BOTH",
          address1: "Plot 44, Bukit Raja Industrial Park",
          postcode: "41200",
          town: "Klang",
          state: "Selangor",
          status: "APPROVED",
        },
        {
          legalName: "Borneo Geotechnical Services",
          email: "admin@borneogeo.com.my",
          applicantType: "COMPANY",
          companyNumber: "202002044811",
          code: "BORNEOGEO",
          uplineCode: "PINSTEEL1",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Sublot 12, Demak Laut Industrial Estate",
          postcode: "93050",
          town: "Kuching",
          state: "Sarawak",
          status: "APPROVED",
        },
      ],
    },

    // NETWORK 2: BINA TECH INFRA (4 Downlines)
    {
      root: {
        legalName: "Bina Tech Infra Pte Ltd",
        email: "contact@binatech.sg",
        applicantType: "COMPANY",
        companyNumber: "201708892K",
        code: "BINATECH88",
        country: "SG",
        currency: "SGD",
        market: "SINGAPORE",
        address1: "12 Marina Boulevard, #24-01 Marina Bay Financial Centre",
        postcode: "018982",
        town: "Singapore",
        state: "Central Region",
        status: "APPROVED",
      },
      downlines: [
        {
          legalName: "Lion City Power & Grid Pte Ltd",
          email: "tender@liongrid.sg",
          applicantType: "COMPANY",
          companyNumber: "201912445E",
          code: "LIONGRID1",
          uplineCode: "BINATECH88",
          country: "SG",
          currency: "SGD",
          market: "SINGAPORE",
          address1: "8 Kallang Avenue, #04-12 Aperia Tower 1",
          postcode: "339407",
          town: "Singapore",
          state: "Central Region",
          status: "APPROVED",
        },
        {
          legalName: "Jurong Industrial Automation",
          email: "eng@jurongauto.sg",
          applicantType: "COMPANY",
          companyNumber: "202105891M",
          code: "JURONGAUT",
          uplineCode: "LIONGRID1",
          country: "SG",
          currency: "SGD",
          market: "SINGAPORE",
          address1: "15 Pioneer Turn, #02-05",
          postcode: "627584",
          town: "Singapore",
          state: "West Region",
          status: "APPROVED",
        },
        {
          legalName: "Tuas High-Voltage Subcontractors",
          email: "projects@tuashv.sg",
          applicantType: "COMPANY",
          companyNumber: "202018933R",
          code: "TUASHV001",
          uplineCode: "BINATECH88",
          country: "SG",
          currency: "SGD",
          market: "SINGAPORE",
          address1: "28 Tuas South Avenue 8",
          postcode: "637648",
          town: "Singapore",
          state: "West Region",
          status: "APPROVED",
        },
        {
          legalName: "Changi MEP Consultants Pte Ltd",
          email: "mep@changiconsult.sg",
          applicantType: "COMPANY",
          companyNumber: "202209481W",
          code: "CHANGIMEP",
          uplineCode: "BINATECH88",
          country: "SG",
          currency: "SGD",
          market: "SINGAPORE",
          address1: "5 Changi Business Park Central 1",
          postcode: "486038",
          town: "Singapore",
          state: "East Region",
          status: "SUBMITTED",
        },
      ],
    },

    // NETWORK 3: NANYANG HEAVY INDUSTRIES (6 Downlines)
    {
      root: {
        legalName: "Nanyang Heavy Industries Corp",
        email: "corp@nanyangheavy.com.my",
        applicantType: "COMPANY",
        companyNumber: "201601009923",
        code: "NANYANG77",
        country: "MY",
        currency: "MYR",
        market: "BOTH",
        address1: "Wisma Nanyang, Suite 12-A, Jalan Skudai",
        postcode: "81200",
        town: "Johor Bahru",
        state: "Johor",
        status: "APPROVED",
      },
      downlines: [
        {
          legalName: "Southern Railway Systems Sdn Bhd",
          email: "projects@southrail.my",
          applicantType: "COMPANY",
          companyNumber: "201901044781",
          code: "SOUTHRAIL",
          uplineCode: "NANYANG77",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "No 18, Jalan Kempas Utama 3/1",
          postcode: "81300",
          town: "Johor Bahru",
          state: "Johor",
          status: "APPROVED",
        },
        {
          legalName: "Johor Crane & Heavy Lift Operations",
          email: "ops@johorcrane.my",
          applicantType: "COMPANY",
          companyNumber: "202101099234",
          code: "JOHORCRAN",
          uplineCode: "SOUTHRAIL",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Plot 88, Pasir Gudang Industrial Estate",
          postcode: "81700",
          town: "Pasir Gudang",
          state: "Johor",
          status: "APPROVED",
        },
        {
          legalName: "Melaka Marine Fabrication Ltd",
          email: "contact@melakamarine.my",
          applicantType: "COMPANY",
          companyNumber: "201801088412",
          code: "MELFAB001",
          uplineCode: "NANYANG77",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Jalan Tanjung Bruang, Hang Tuah Jaya",
          postcode: "75450",
          town: "Melaka",
          state: "Melaka",
          status: "APPROVED",
        },
        {
          legalName: "Straits Offshore Maintenance",
          email: "service@straitsoffshore.my",
          applicantType: "COMPANY",
          companyNumber: "202001077819",
          code: "STRAITOFF",
          uplineCode: "MELFAB001",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "No 5, Kawasan Perindustrian Cheng",
          postcode: "75250",
          town: "Melaka",
          state: "Melaka",
          status: "APPROVED",
        },
        {
          legalName: "Batu Pahat Dockyard Support",
          email: "batu@dockyard.my",
          applicantType: "COMPANY",
          companyNumber: "202203011488",
          code: "BATUDOCK1",
          uplineCode: "STRAITOFF",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "No 88, Jalan Tongkang Pechah",
          postcode: "83000",
          town: "Batu Pahat",
          state: "Johor",
          status: "APPROVED",
        },
        {
          legalName: "Kuantan Port Logistics Engineering",
          email: "logistics@kuantanport.my",
          applicantType: "COMPANY",
          companyNumber: "201901055811",
          code: "KUANTANLE",
          uplineCode: "NANYANG77",
          country: "MY",
          currency: "MYR",
          market: "MALAYSIA",
          address1: "Kuantan Port Industrial Zone, Gebeng",
          postcode: "26080",
          town: "Kuantan",
          state: "Pahang",
          status: "APPROVED",
        },
      ],
    },
  ];

  for (const net of networks) {
    const allNodes = [net.root, ...net.downlines];

    for (const node of allNodes) {
      const appNum = `FDA-2026-${node.code.slice(0, 6)}`;

      // 1. Insert or Update User with password ABCDefgh1234!@#$
      const [uRes] = await conn.execute(
        "INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, 'AFFILIATE', 'ACTIVE') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), full_name=VALUES(full_name), id=LAST_INSERT_ID(id)",
        [node.email, passwordHash, node.legalName]
      );

      const userId = uRes.insertId;

      // 2. Insert or Update Affiliate Application
      await conn.execute(
        `INSERT INTO affiliate_applications 
         (user_id, application_number, applicant_type, legal_name, company_number, country_code, phone, address_line1, postcode, town, state, currency, market_focus, audience_description, promotion_method, id_doc_path, holding_id_path, status, affiliate_code, upline_affiliate_code, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE legal_name=VALUES(legal_name), upline_affiliate_code=VALUES(upline_affiliate_code), status=VALUES(status)`,
        [
          userId,
          appNum,
          node.applicantType,
          node.legalName,
          node.companyNumber,
          node.country,
          "+60123456789",
          node.address1,
          node.postcode,
          node.town,
          node.state,
          node.currency,
          node.market,
          "Engineering contractors & EPC project leaders in Malaysia and Singapore.",
          "Direct B2B referrals, industry seminars, and project partner introductions.",
          "/uploads/id-documents/sample_id.pdf",
          "/uploads/id-documents/sample_holding.jpg",
          node.status,
          node.code,
          node.uplineCode || null,
        ]
      );

      console.log(`Seeded Affiliate: ${node.legalName} (${node.code}) -> Upline: ${node.uplineCode || "ROOT"}`);
    }
  }

  await conn.end();
  console.log("Seeding complete! All passwords set to ABCDefgh1234!@#$");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
