import { cookies } from "next/headers";
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export function hashPassword(password:string, salt=randomBytes(16).toString("hex")) {
  const hash=pbkdf2Sync(password,salt,210000,32,"sha512").toString("hex");
  return `pbkdf2$210000$${salt}$${hash}`;
}
export function verifyPassword(password:string, stored:string) {
  const [kind, rounds, salt, hash]=stored.split("$"); if(kind!=="pbkdf2") return false;
  const actual=pbkdf2Sync(password,salt,Number(rounds),32,"sha512"); const expected=Buffer.from(hash,"hex");
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
export async function createSession(userId:number){
  const token=randomBytes(32).toString("hex"), tokenHash=createHash("sha256").update(token).digest("hex");
  await db().execute("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",[userId,tokenHash]);
  const jar=await cookies(); jar.set("fd_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:604800});
}
export async function currentUser(){
  const token=(await cookies()).get("fd_session")?.value; if(!token) return null;
  const hash=createHash("sha256").update(token).digest("hex");
  const [rows]=await db().execute<any[]>("SELECT u.id,u.email,u.full_name,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>NOW() LIMIT 1",[hash]);
  return rows[0]||null;
}
export async function requireAdmin(){const user=await currentUser(); return user?.role==="ADMIN"?user:null;}
// T-301 (plan §7.1): parallel helper to requireAdmin(), scoped to the new MANAGEMENT role.
// Matches requireAdmin()'s return-null-on-failure convention rather than throwing, since every
// existing caller in this codebase checks the return value for null (see app/api/admin/*/route.ts).
export async function requireManagement(){const user=await currentUser(); return user?.role==="MANAGEMENT"?user:null;}
export function getBaseUrl(req: Request) {
  const host = req.headers.get("host") || "localhost";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}
export function generateAffiliateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const bytes = randomBytes(9);
  for (let i = 0; i < 9; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
