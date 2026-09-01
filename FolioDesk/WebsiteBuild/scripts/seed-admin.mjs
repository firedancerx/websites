import mysql from "mysql2/promise"; import {randomBytes,pbkdf2Sync} from "node:crypto"; import process from "node:process";
const {DATABASE_URL,ADMIN_EMAIL="admin@foliodesk.local",ADMIN_PASSWORD,ADMIN_NAME="FolioDesk Administrator"}=process.env;
if(!DATABASE_URL||!ADMIN_PASSWORD) throw new Error("DATABASE_URL and ADMIN_PASSWORD are required");
const salt=randomBytes(16).toString("hex"),hash=pbkdf2Sync(ADMIN_PASSWORD,salt,210000,32,"sha512").toString("hex"),encoded=`pbkdf2$210000$${salt}$${hash}`;
const db=await mysql.createConnection(DATABASE_URL);
try{await db.execute("INSERT INTO users(email,password_hash,full_name,role,status) VALUES(?,?,?,'ADMIN','ACTIVE') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),full_name=VALUES(full_name),role='ADMIN',status='ACTIVE'",[ADMIN_EMAIL.toLowerCase(),encoded,ADMIN_NAME]); console.log(`Admin ready: ${ADMIN_EMAIL}`);}finally{await db.end();}
