import { db } from "./src/db";
import { clients, serviceOrders } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allClients = await db.select().from(clients);
  console.log("Clients:", allClients.filter(c => c.name.includes("Jos")));
  
  const allOS = await db.select().from(serviceOrders);
  console.log("OS length:", allOS.length);
  
  const targetClient = allClients.find(c => c.accessCode === "CLI-JOSEHE");
  if (targetClient) {
    const osForClient = allOS.filter(o => o.clientId === targetClient.id);
    console.log("OS for CLI-JOSEHE:", osForClient);
  } else {
    console.log("Client CLI-JOSEHE not found");
  }
}

main().catch(console.error);
