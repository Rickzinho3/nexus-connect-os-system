import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();

  if (!session) {
    return Response.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  await db
    .update(tenants)
    .set({
      lastSeen: new Date(),
    })
    .where(
      eq(tenants.id, session?.user?.tenantId as string)
    );

  return Response.json({ ok: true });
}