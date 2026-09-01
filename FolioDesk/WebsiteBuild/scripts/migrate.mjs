import mysql from "mysql2/promise"; import fs from "node:fs/promises"; import path from "node:path"; import process from "node:process";
const url=process.env.DATABASE_URL; if(!url) throw new Error("DATABASE_URL is required");
const sql=await fs.readFile(path.join(process.cwd(),"db/mysql-schema.sql"),"utf8");
const connection=await mysql.createConnection({uri:url,multipleStatements:true});
try{await connection.query(sql); console.log("FolioDesk MySQL schema is ready.");}finally{await connection.end();}
