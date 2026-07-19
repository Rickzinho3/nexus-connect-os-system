import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { employees } from "../src/db/schema";
import bcrypt from "bcryptjs"; // Need to use bcryptjs for the script, or we can use node-bcrypt if installed.
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("Seeding Super Admin...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await db.insert(employees).values({
    id: "SUPER-ADMIN",
    tenantId: null,
    cpfCnpj: "00000000000",
    password: hashedPassword,
    name: "Administrador do Sistema",
    role: "Super Admin",
    email: "admin@nexus.com",
    phone: "0000000000",
    status: "Ativo",
  }).onConflictDoNothing(); // Prevent error if it already exists (if unique constraint is added)
  
  console.log("Super Admin seeded! Login with 00000000000 / admin123");
}

main().catch(console.error);
