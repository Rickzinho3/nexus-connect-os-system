"use server";

import { db, tenants, clients, serviceOrders, quotes, parts, sales, employees, cashLogs, goals, cashSessions, financialTransactions } from "@/db";
import { eq, and, desc } from "drizzle-orm";

// 0. Multi-tenant context helper: auto-seeds a default tenant for single-tenant mode, ready for future SaaS Auth
async function getOrCreateTenantId() {
  const existing = await db.select().from(tenants).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [created] = await db.insert(tenants).values({
    name: "Cornerstone Autocenter",
    cnpj: "12.345.678/0001-90",
    address: "Av. das Nações Unidas, 1200 - São Paulo, SP",
  }).returning();
  return created.id;
}

// Access Code Generator (CLI-XXXXXX)
function generateAccessCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CLI-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Clients Actions
export async function getClients() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
    .orderBy(desc(clients.createdAt));
  return list.map(c => ({
    ...c,
    status: c.status as "Ativo" | "Inativo"
  }));
}

export async function addClient(formData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  cpfCnpj: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const accessCode = generateAccessCode();
  const [created] = await db
    .insert(clients)
    .values({
      tenantId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      cpfCnpj: formData.cpfCnpj,
      accessCode,
      status: "Ativo",
    })
    .returning();
  return created;
}

export async function updateClient(id: string, formData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  cpfCnpj: string;
  status: "Ativo" | "Inativo";
}) {
  const [updated] = await db
    .update(clients)
    .set({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      cpfCnpj: formData.cpfCnpj,
      status: formData.status,
    })
    .where(eq(clients.id, id))
    .returning();
  return updated;
}

export async function deleteClient(id: string) {
  const [deleted] = await db
    .delete(clients)
    .where(eq(clients.id, id))
    .returning();
  return deleted;
}

// 2. Service Orders (O.S.) Actions
export async function getServiceOrders() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select({
      id: serviceOrders.id,
      clientId: serviceOrders.clientId,
      client: clients.name,
      device: serviceOrders.deviceName,
      serviceType: serviceOrders.serviceType,
      value: serviceOrders.value,
      status: serviceOrders.status,
      date: serviceOrders.date,
      notes: serviceOrders.notes,
      photos: serviceOrders.photos,
    })
    .from(serviceOrders)
    .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
    .where(eq(serviceOrders.tenantId, tenantId))
    .orderBy(desc(serviceOrders.createdAt));

  return list.map(o => ({
    ...o,
    value: parseFloat(o.value),
    status: o.status as "Pendente" | "Em Andamento" | "Concluído" | "Cancelado"
  }));
}

export async function addServiceOrder(formData: {
  clientId: string;
  deviceName: string;
  serviceType: string;
  value: number;
  photos?: string[];
}) {
  const tenantId = await getOrCreateTenantId();
  const id = `OS-${Math.floor(1000 + Math.random() * 9000)}`;
  const [created] = await db
    .insert(serviceOrders)
    .values({
      id,
      tenantId,
      clientId: formData.clientId,
      deviceName: formData.deviceName,
      serviceType: formData.serviceType,
      value: formData.value.toString(),
      status: "Pendente",
      photos: formData.photos || null,
      date: new Date().toLocaleDateString("pt-BR"),
    })
    .returning();
  return created;
}

export async function getServiceOrderById(id: string) {
  const tenantId = await getOrCreateTenantId();
  const [order] = await db
    .select({
      id: serviceOrders.id,
      clientId: serviceOrders.clientId,
      client: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      device: serviceOrders.deviceName,
      serviceType: serviceOrders.serviceType,
      value: serviceOrders.value,
      status: serviceOrders.status,
      date: serviceOrders.date,
      notes: serviceOrders.notes,
      photos: serviceOrders.photos,
      createdAt: serviceOrders.createdAt,
    })
    .from(serviceOrders)
    .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.tenantId, tenantId)))
    .limit(1);
    
  if (order) {
    return {
      ...order,
      value: parseFloat(order.value),
      status: order.status as "Pendente" | "Em Andamento" | "Concluído" | "Cancelado"
    };
  }
  return null;
}

async function registerOSPayment(osId: string, value: number, deviceName: string, clientId: string) {
  const tenantId = await getOrCreateTenantId();
  const todayStr = new Date().toLocaleDateString("pt-BR");
  const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const exists = await db
    .select()
    .from(financialTransactions)
    .where(and(eq(financialTransactions.tenantId, tenantId), eq(financialTransactions.description, `OS Paga ${osId} - ${deviceName}`)))
    .limit(1);

  if (exists.length > 0) return;

  const matchedClient = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const clientName = matchedClient.length > 0 ? matchedClient[0].name : "Cliente Geral";

  await db.insert(financialTransactions).values({
    tenantId,
    description: `OS Paga ${osId} - ${deviceName}`,
    type: "Receita",
    amount: value.toString(),
    category: "OS",
    status: "Pago",
    paymentMethod: "Pix",
    responsible: "Técnico",
    date: todayStr,
    time: timeStr,
  });
}

export async function updateServiceOrder(id: string, formData: {
  deviceName: string;
  serviceType: string;
  value: number;
  status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  notes?: string;
}) {
  const existingList = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1);
  const existing = existingList[0];

  const [updated] = await db
    .update(serviceOrders)
    .set({
      deviceName: formData.deviceName,
      serviceType: formData.serviceType,
      value: formData.value.toString(),
      status: formData.status,
      notes: formData.notes || "",
    })
    .where(eq(serviceOrders.id, id))
    .returning();

  if (formData.status === "Concluído" && existing && existing.status !== "Concluído") {
    await registerOSPayment(id, formData.value, formData.deviceName, existing.clientId);
  }

  return updated;
}

export async function updateServiceOrderStatus(id: string, status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado") {
  const existingList = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1);
  const existing = existingList[0];

  const [updated] = await db
    .update(serviceOrders)
    .set({ status })
    .where(eq(serviceOrders.id, id))
    .returning();

  if (status === "Concluído" && existing && existing.status !== "Concluído") {
    await registerOSPayment(id, parseFloat(existing.value), existing.deviceName, existing.clientId);
  }

  return updated;
}

export async function deleteServiceOrder(id: string) {
  const [deleted] = await db
    .delete(serviceOrders)
    .where(eq(serviceOrders.id, id))
    .returning();
  return deleted;
}

// 3. Quotes (Orçamentos) Actions
export async function getQuotes() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select({
      id: quotes.id,
      clientId: quotes.clientId,
      client: clients.name,
      device: quotes.deviceName,
      description: quotes.description,
      value: quotes.value,
      status: quotes.status,
      validUntil: quotes.validUntil,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .where(eq(quotes.tenantId, tenantId))
    .orderBy(desc(quotes.createdAt));

  return list.map(q => ({
    ...q,
    value: parseFloat(q.value),
    status: q.status as "Pendente" | "Aprovado" | "Rejeitado" | "Expirado"
  }));
}

export async function addQuote(formData: {
  clientId: string;
  deviceName: string;
  description: string;
  value: number;
  validUntil: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const id = `ORC-${Math.floor(5000 + Math.random() * 900)}`;
  const [created] = await db
    .insert(quotes)
    .values({
      id,
      tenantId,
      clientId: formData.clientId,
      deviceName: formData.deviceName,
      description: formData.description,
      value: formData.value.toString(),
      status: "Pendente",
      validUntil: formData.validUntil,
    })
    .returning();
  return created;
}

export async function updateQuote(id: string, formData: {
  deviceName: string;
  description: string;
  value: number;
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Expirado";
  validUntil: string;
}) {
  const [updated] = await db
    .update(quotes)
    .set({
      deviceName: formData.deviceName,
      description: formData.description,
      value: formData.value.toString(),
      status: formData.status,
      validUntil: formData.validUntil,
    })
    .where(eq(quotes.id, id))
    .returning();
  return updated;
}

export async function approveQuote(id: string) {
  const [updated] = await db
    .update(quotes)
    .set({ status: "Aprovado" })
    .where(eq(quotes.id, id))
    .returning();
  return updated;
}

export async function rejectQuote(id: string) {
  const [updated] = await db
    .update(quotes)
    .set({ status: "Rejeitado" })
    .where(eq(quotes.id, id))
    .returning();
  return updated;
}

export async function deleteQuote(id: string) {
  const [deleted] = await db
    .delete(quotes)
    .where(eq(quotes.id, id))
    .returning();
  return deleted;
}

// 4. Parts (Componentes) Actions
export async function getParts() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(parts)
    .where(eq(parts.tenantId, tenantId))
    .orderBy(parts.sku);

  return list.map(p => ({
    ...p,
    price: parseFloat(p.price)
  }));
}

export async function replenishStock(sku: string, currentStock: number, minStock: number) {
  const tenantId = await getOrCreateTenantId();
  const added = minStock * 2;
  const newStock = currentStock + added;

  const matched = await db.select().from(parts).where(eq(parts.sku, sku)).limit(1);
  const part = matched[0];

  const [updated] = await db
    .update(parts)
    .set({ quantity: newStock })
    .where(eq(parts.sku, sku))
    .returning();

  if (part) {
    const cost = added * parseFloat(part.price);
    const todayStr = new Date().toLocaleDateString("pt-BR");
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    await db.insert(financialTransactions).values({
      tenantId,
      description: `Compra de Peças: +${added} un de ${part.name}`,
      type: "Despesa",
      amount: cost.toString(),
      category: "Peças",
      status: "Pago",
      paymentMethod: "Pix",
      responsible: "Sistema",
      date: todayStr,
      time: timeStr,
    });
  }

  return updated;
}

export async function addPart(formData: {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
}) {
  const tenantId = await getOrCreateTenantId();
  const [created] = await db
    .insert(parts)
    .values({
      sku: formData.sku,
      tenantId,
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
      minQuantity: formData.minQuantity,
      price: formData.price.toString(),
    })
    .returning();
  return created;
}

export async function updatePart(sku: string, formData: {
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
}) {
  const [updated] = await db
    .update(parts)
    .set({
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
      minQuantity: formData.minQuantity,
      price: formData.price.toString(),
    })
    .where(eq(parts.sku, sku))
    .returning();
  return updated;
}

export async function deletePart(sku: string) {
  const [deleted] = await db
    .delete(parts)
    .where(eq(parts.sku, sku))
    .returning();
  return deleted;
}

// 5. Sales Actions
export async function getSales() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select({
      id: sales.id,
      client: clients.name,
      paymentMethod: sales.paymentMethod,
      amount: sales.amount,
      date: sales.date,
    })
    .from(sales)
    .leftJoin(clients, eq(sales.clientId, clients.id))
    .where(eq(sales.tenantId, tenantId))
    .orderBy(desc(sales.createdAt));

  return list.map(s => ({
    ...s,
    client: s.client || "Cliente de Balcão",
    amount: parseFloat(s.amount),
    paymentMethod: s.paymentMethod as "Pix" | "Cartão" | "Dinheiro"
  }));
}

export async function addSale(formData: {
  clientName: string;
  paymentMethod: "Pix" | "Cartão" | "Dinheiro";
  amount: number;
}) {
  const tenantId = await getOrCreateTenantId();
  const id = `VEN-${Math.floor(3000 + Math.random() * 900)}`;
  const todayStr = new Date().toLocaleDateString("pt-BR");
  const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  let clientId: string | null = null;
  if (formData.clientName && formData.clientName !== "Cliente de Balcão") {
    const matched = await db.select().from(clients).where(and(eq(clients.tenantId, tenantId), eq(clients.name, formData.clientName))).limit(1);
    if (matched.length > 0) {
      clientId = matched[0].id;
    }
  }

  const [created] = await db
    .insert(sales)
    .values({
      id,
      tenantId,
      clientId,
      paymentMethod: formData.paymentMethod,
      amount: formData.amount.toString(),
      date: todayStr,
    })
    .returning();

  await db.insert(financialTransactions).values({
    tenantId,
    description: `Venda ${id} - ${formData.clientName}`,
    type: "Receita",
    amount: formData.amount.toString(),
    category: "Venda",
    status: "Pago",
    paymentMethod: formData.paymentMethod,
    responsible: "Sistema",
    date: todayStr,
    time: timeStr,
  });

  if (formData.paymentMethod === "Dinheiro") {
    const openSession = await getCurrentOpenSession();
    if (openSession) {
      await db.insert(cashLogs).values({
        tenantId,
        sessionId: openSession.id,
        type: "Venda",
        description: `Venda ${id} - Balcão`,
        value: formData.amount.toString(),
        category: "Venda",
        paymentMethod: "Dinheiro",
        responsible: "Sistema",
        time: timeStr,
        date: todayStr,
      });
    }
  }

  return created;
}

export async function updateSale(id: string, formData: {
  clientName: string;
  paymentMethod: "Pix" | "Cartão" | "Dinheiro";
  amount: number;
}) {
  const tenantId = await getOrCreateTenantId();
  let clientId: string | null = null;
  if (formData.clientName && formData.clientName !== "Cliente de Balcão") {
    const matched = await db.select().from(clients).where(and(eq(clients.tenantId, tenantId), eq(clients.name, formData.clientName))).limit(1);
    if (matched.length > 0) {
      clientId = matched[0].id;
    }
  }

  const [updated] = await db
    .update(sales)
    .set({
      clientId,
      paymentMethod: formData.paymentMethod,
      amount: formData.amount.toString(),
    })
    .where(eq(sales.id, id))
    .returning();
  return updated;
}

export async function deleteSale(id: string) {
  const [deleted] = await db
    .delete(sales)
    .where(eq(sales.id, id))
    .returning();
  return deleted;
}

// 6. Employees Actions
export async function getEmployees() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(employees)
    .where(eq(employees.tenantId, tenantId))
    .orderBy(employees.id);
  return list.map(e => ({
    ...e,
    status: e.status as "Ativo" | "Férias" | "Afastado"
  }));
}

export async function addEmployee(formData: {
  name: string;
  role: string;
  email: string;
  phone: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const id = `FUN-${Math.floor(10 + Math.random() * 90)}`;
  const [created] = await db
    .insert(employees)
    .values({
      id,
      tenantId,
      name: formData.name,
      role: formData.role,
      email: formData.email,
      phone: formData.phone,
      status: "Ativo",
    })
    .returning();
  return created;
}

export async function updateEmployee(id: string, formData: {
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "Ativo" | "Férias" | "Afastado";
}) {
  const [updated] = await db
    .update(employees)
    .set({
      name: formData.name,
      role: formData.role,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
    })
    .where(eq(employees.id, id))
    .returning();
  return updated;
}

export async function deleteEmployee(id: string) {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning();
  return deleted;
}

// 7. Cash Drawer Session & Logs Actions
export async function getCurrentOpenSession() {
  const tenantId = await getOrCreateTenantId();
  const sessions = await db
    .select()
    .from(cashSessions)
    .where(and(eq(cashSessions.tenantId, tenantId), eq(cashSessions.status, "Aberto")))
    .limit(1);
  if (sessions.length === 0) return null;
  const session = sessions[0];
  return {
    ...session,
    initialValue: parseFloat(session.initialValue),
    expectedValue: parseFloat(session.expectedValue),
    countedValue: session.countedValue ? parseFloat(session.countedValue) : null,
    difference: session.difference ? parseFloat(session.difference) : null,
  };
}

export async function openCashSession(formData: { initialValue: number; responsible: string }) {
  const tenantId = await getOrCreateTenantId();
  const todayStr = new Date().toLocaleDateString("pt-BR");

  const open = await db
    .select()
    .from(cashSessions)
    .where(and(eq(cashSessions.tenantId, tenantId), eq(cashSessions.status, "Aberto")))
    .limit(1);
  if (open.length > 0) {
    throw new Error("Já existe um caixa aberto.");
  }

  const [created] = await db
    .insert(cashSessions)
    .values({
      tenantId,
      status: "Aberto",
      initialValue: formData.initialValue.toString(),
      expectedValue: formData.initialValue.toString(),
      responsible: formData.responsible,
      date: todayStr,
    })
    .returning();

  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  await db.insert(cashLogs).values({
    tenantId,
    sessionId: created.id,
    type: "Abertura",
    description: "Abertura de caixa",
    value: formData.initialValue.toString(),
    category: "Abertura",
    paymentMethod: "Dinheiro",
    responsible: formData.responsible,
    time,
    date: todayStr,
  });

  return created;
}

export async function closeCashSession(sessionId: number, formData: { countedValue: number; notes?: string; responsible: string }) {
  const sessions = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId)).limit(1);
  if (sessions.length === 0) throw new Error("Sessão de caixa não encontrada.");
  
  const logs = await db.select().from(cashLogs).where(eq(cashLogs.sessionId, sessionId));
  const totalDrawerCash = logs.reduce((sum, log) => sum + parseFloat(log.value), 0);
  const difference = formData.countedValue - totalDrawerCash;

  const [updated] = await db
    .update(cashSessions)
    .set({
      status: "Fechado",
      closedAt: new Date(),
      expectedValue: totalDrawerCash.toString(),
      countedValue: formData.countedValue.toString(),
      difference: difference.toString(),
      notes: formData.notes || "",
      responsible: formData.responsible,
    })
    .where(eq(cashSessions.id, sessionId))
    .returning();

  return updated;
}

export async function getCashSessions() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(cashSessions)
    .where(eq(cashSessions.tenantId, tenantId))
    .orderBy(desc(cashSessions.openedAt));
  return list.map(s => ({
    ...s,
    initialValue: parseFloat(s.initialValue),
    expectedValue: parseFloat(s.expectedValue),
    countedValue: s.countedValue ? parseFloat(s.countedValue) : null,
    difference: s.difference ? parseFloat(s.difference) : null,
  }));
}

export async function getCashLogs() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(cashLogs)
    .where(eq(cashLogs.tenantId, tenantId))
    .orderBy(desc(cashLogs.createdAt));

  return list.map(l => ({
    ...l,
    value: parseFloat(l.value),
    type: l.type as "Abertura" | "Suprimento" | "Sangria" | "Venda" | "Serviço",
    paymentMethod: l.paymentMethod as "Dinheiro" | "Pix" | "Cartão",
  }));
}

export async function getSessionCashLogs(sessionId: number) {
  const list = await db
    .select()
    .from(cashLogs)
    .where(eq(cashLogs.sessionId, sessionId))
    .orderBy(desc(cashLogs.createdAt));

  return list.map(l => ({
    ...l,
    value: parseFloat(l.value),
    type: l.type as "Abertura" | "Suprimento" | "Sangria" | "Venda" | "Serviço",
    paymentMethod: l.paymentMethod as "Dinheiro" | "Pix" | "Cartão",
  }));
}

export async function addCashLog(formData: {
  type: "Abertura" | "Suprimento" | "Sangria" | "Venda" | "Serviço";
  description: string;
  value: number;
  category?: string;
  paymentMethod?: string;
  responsible?: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = new Date().toLocaleDateString("pt-BR");

  const openSession = await getCurrentOpenSession();
  if (!openSession && formData.type !== "Abertura") {
    throw new Error("Não há caixa aberto. Abra o caixa primeiro.");
  }

  const sessionId = openSession ? openSession.id : null;
  const category = formData.category || (formData.type === "Sangria" ? "Retirada" : "Entrada");
  const paymentMethod = formData.paymentMethod || "Dinheiro";
  const responsible = formData.responsible || "Sistema";

  const [created] = await db
    .insert(cashLogs)
    .values({
      tenantId,
      sessionId,
      type: formData.type,
      description: formData.description,
      value: formData.value.toString(),
      category,
      paymentMethod,
      responsible,
      time,
      date,
    })
    .returning();

  if (formData.type === "Sangria" || formData.type === "Suprimento") {
    const finType = formData.type === "Sangria" ? "Despesa" : "Receita";
    await db.insert(financialTransactions).values({
      tenantId,
      description: formData.description,
      type: finType,
      amount: Math.abs(formData.value).toString(),
      category: category,
      status: "Pago",
      paymentMethod: paymentMethod,
      responsible: responsible,
      date,
      time,
    });
  }

  return created;
}

export async function updateCashLog(id: number, formData: {
  type: "Abertura" | "Suprimento" | "Sangria" | "Venda";
  description: string;
  value: number;
  category?: string;
  paymentMethod?: string;
  responsible?: string;
}) {
  const [updated] = await db
    .update(cashLogs)
    .set({
      type: formData.type,
      description: formData.description,
      value: formData.value.toString(),
      category: formData.category || "Geral",
      paymentMethod: formData.paymentMethod || "Dinheiro",
      responsible: formData.responsible || "Sistema",
    })
    .where(eq(cashLogs.id, id))
    .returning();
  return updated;
}

export async function deleteCashLog(id: number) {
  const [deleted] = await db
    .delete(cashLogs)
    .where(eq(cashLogs.id, id))
    .returning();
  return deleted;
}

// 7.1 Financial Transactions Server Actions
export async function getFinancialTransactions() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.tenantId, tenantId))
    .orderBy(desc(financialTransactions.createdAt));
  return list.map(t => ({
    ...t,
    amount: parseFloat(t.amount),
    type: t.type as "Receita" | "Despesa",
    status: t.status as "Pago" | "Pendente",
  }));
}

export async function addFinancialTransaction(formData: {
  description: string;
  type: "Receita" | "Despesa";
  amount: number;
  category: string;
  status: "Pago" | "Pendente";
  dueDate?: string;
  paymentMethod?: string;
  responsible?: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const date = new Date().toLocaleDateString("pt-BR");
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const [created] = await db
    .insert(financialTransactions)
    .values({
      tenantId,
      description: formData.description,
      type: formData.type,
      amount: formData.amount.toString(),
      category: formData.category,
      status: formData.status,
      dueDate: formData.dueDate || null,
      paymentMethod: formData.paymentMethod || null,
      responsible: formData.responsible || "Sistema",
      date,
      time,
    })
    .returning();
  return created;
}

export async function payFinancialTransaction(id: string, paymentMethod: string, responsible: string) {
  const [updated] = await db
    .update(financialTransactions)
    .set({
      status: "Pago",
      paymentMethod,
      responsible,
    })
    .where(eq(financialTransactions.id, id))
    .returning();

  if (updated && paymentMethod === "Dinheiro") {
    const openSession = await getCurrentOpenSession();
    if (openSession) {
      const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const date = new Date().toLocaleDateString("pt-BR");
      const val = parseFloat(updated.amount);
      const typeStr = updated.type === "Receita" ? "Suprimento" : "Sangria";
      const finalVal = updated.type === "Receita" ? val : -val;

      await db.insert(cashLogs).values({
        tenantId: updated.tenantId,
        sessionId: openSession.id,
        type: typeStr,
        description: `Pgto fatura: ${updated.description}`,
        value: finalVal.toString(),
        category: updated.category,
        paymentMethod: "Dinheiro",
        responsible,
        time,
        date,
      });
    }
  }
  return updated;
}

export async function deleteFinancialTransaction(id: string) {
  const [deleted] = await db
    .delete(financialTransactions)
    .where(eq(financialTransactions.id, id))
    .returning();
  return deleted;
}

// 8. Settings Actions
export async function getSettings() {
  const tenantId = await getOrCreateTenantId();
  const matched = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return matched[0];
}

export async function updateSettings(formData: {
  name: string;
  cnpj: string;
  address: string;
  taxRate: string;
  commissionRate: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const [updated] = await db
    .update(tenants)
    .set({
      name: formData.name,
      cnpj: formData.cnpj,
      address: formData.address,
      taxRate: formData.taxRate,
      commissionRate: formData.commissionRate,
    })
    .where(eq(tenants.id, tenantId))
    .returning();
  return updated;
}

// 9. Goals (Metas) Actions
export async function getGoals() {
  const tenantId = await getOrCreateTenantId();
  const list = await db
    .select()
    .from(goals)
    .where(eq(goals.tenantId, tenantId))
    .orderBy(goals.id);

  // Auto-calculate real current values for the current month
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const allTxs = await db.select().from(financialTransactions).where(eq(financialTransactions.tenantId, tenantId));
  const currentMonthRevenue = allTxs.reduce((sum, tx) => {
    if (tx.type !== "Receita" || tx.status !== "Pago") return sum;
    const parts = tx.date.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (month === currentMonthIdx && year === currentYear) {
        return sum + parseFloat(tx.amount);
      }
    }
    return sum;
  }, 0);

  const allOs = await db.select().from(serviceOrders).where(eq(serviceOrders.tenantId, tenantId));
  const currentMonthOS = allOs.reduce((sum, os) => {
    if (os.status !== "Concluído") return sum;
    const parts = os.date.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (month === currentMonthIdx && year === currentYear) {
        return sum + 1;
      }
    }
    return sum;
  }, 0);

  return list.map(g => {
    let currentVal = parseFloat(g.current);
    
    const nameLower = g.name.toLowerCase();
    
    // Auto-update Faturamento
    if (g.category === "Financeiro" && nameLower.includes("faturamento")) {
      currentVal = currentMonthRevenue;
    }
    
    // Auto-update O.S. Concluídas
    if (g.category === "Operacional" && (nameLower.includes("os") || nameLower.includes("ordem") || nameLower.includes("concluída"))) {
      currentVal = currentMonthOS;
    }

    return {
      id: g.id,
      name: g.name,
      category: g.category,
      current: currentVal,
      target: parseFloat(g.target),
      unit: g.unit,
      deadline: g.deadline,
    };
  });
}

export async function addGoal(formData: {
  name: string;
  category: string;
  target: number;
  unit: string;
  deadline: string;
}) {
  const tenantId = await getOrCreateTenantId();
  const [created] = await db
    .insert(goals)
    .values({
      tenantId,
      name: formData.name,
      category: formData.category,
      target: formData.target.toString(),
      current: "0",
      unit: formData.unit,
      deadline: formData.deadline,
    })
    .returning();
  return created;
}

export async function updateGoal(id: number, formData: {
  name: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
}) {
  const [updated] = await db
    .update(goals)
    .set({
      name: formData.name,
      category: formData.category,
      target: formData.target.toString(),
      current: formData.current.toString(),
      unit: formData.unit,
      deadline: formData.deadline,
    })
    .where(eq(goals.id, id))
    .returning();
  return updated;
}

export async function deleteGoal(id: number) {
  const [deleted] = await db
    .delete(goals)
    .where(eq(goals.id, id))
    .returning();
  return deleted;
}

// 10. Public Client Portal Query (Updated for CPF & AccessCode verification)
export async function queryOSByAccessCodeAndCpf(accessCode: string, cpfCnpj: string) {
  // Normalize strings
  const cleanCode = accessCode.trim().toUpperCase();
  const cleanCpf = cpfCnpj.replace(/\D/g, "");

  const list = await db
    .select()
    .from(clients)
    .where(eq(clients.accessCode, cleanCode))
    .limit(1);

  if (list.length === 0) {
    return null;
  }

  const client = list[0];
  const clientCpfNormalized = client.cpfCnpj.replace(/\D/g, "");

  if (clientCpfNormalized !== cleanCpf) {
    return null;
  }

  // Retrieve active and historical service orders
  const orders = await db
    .select({
      id: serviceOrders.id,
      deviceName: serviceOrders.deviceName,
      serviceType: serviceOrders.serviceType,
      value: serviceOrders.value,
      status: serviceOrders.status,
      date: serviceOrders.date,
      notes: serviceOrders.notes,
    })
    .from(serviceOrders)
    .where(eq(serviceOrders.clientId, client.id))
    .orderBy(desc(serviceOrders.createdAt));

  // Retrieve quotes (Orçamentos) for history
  const clientQuotes = await db
    .select({
      id: quotes.id,
      deviceName: quotes.deviceName,
      description: quotes.description,
      value: quotes.value,
      status: quotes.status,
      validUntil: quotes.validUntil,
    })
    .from(quotes)
    .where(eq(quotes.clientId, client.id))
    .orderBy(desc(quotes.createdAt));

  return {
    client: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      cpfCnpj: client.cpfCnpj,
      accessCode: client.accessCode,
    },
    orders: orders.map(o => ({
      ...o,
      value: parseFloat(o.value),
      status: o.status as "Pendente" | "Em Andamento" | "Concluído" | "Cancelado"
    })),
    quotes: clientQuotes.map(q => ({
      ...q,
      value: parseFloat(q.value),
      status: q.status as "Pendente" | "Aprovado" | "Rejeitado" | "Expirado"
    }))
  };
}

// Legacy function keep to avoid build error elsewhere if any
export async function queryOSByAccessCode(accessCode: string) {
  const list = await db.select().from(clients).where(eq(clients.accessCode, accessCode)).limit(1);
  if (list.length === 0) return null;
  const client = list[0];
  const orders = await db.select().from(serviceOrders).where(eq(serviceOrders.clientId, client.id));
  return { client, orders };
}

// Seed Initial Data (Helper to prepopulate tables when empty)
export async function seedInitialDatabase() {
  const tenantId = await getOrCreateTenantId();

  const existingClients = await db.select().from(clients).limit(1);
  if (existingClients.length > 0) return; // already seeded

  // Seed Clients
  const [cli1] = await db.insert(clients).values({
    tenantId, name: "Marcos Silveira", email: "marcos.silv@gmail.com", phone: "(11) 98711-2093", address: "Av. das Nações Unidas, 1000", accessCode: "CLI-MARK94", status: "Ativo", cpfCnpj: "123.456.789-10"
  }).returning();

  const [cli2] = await db.insert(clients).values({
    tenantId, name: "Clara Mendes", email: "clara.mendes@outlook.com", phone: "(11) 96544-3294", address: "Alameda Santos, 456", accessCode: "CLI-CLAR32", status: "Ativo", cpfCnpj: "987.654.321-00"
  }).returning();

  const [cli3] = await db.insert(clients).values({
    tenantId, name: "Carlos Eduardo Silva", email: "carlosedu@yahoo.com.br", phone: "(11) 94821-4920", address: "Rua Augusta, 789", accessCode: "CLI-CARL21", status: "Ativo", cpfCnpj: "111.222.333-44"
  }).returning();

  const [cli4] = await db.insert(clients).values({
    tenantId, name: "Beatriz Nogueira", email: "bia.nogueira@gmail.com", phone: "(11) 91234-5678", address: "Av. Rebouças, 2500", accessCode: "CLI-BIA910", status: "Ativo", cpfCnpj: "555.666.777-88"
  }).returning();

  // Seed Service Orders
  await db.insert(serviceOrders).values([
    { id: "OS-1094", tenantId, clientId: cli1.id, deviceName: "iPhone 13 Pro", serviceType: "Troca de Tela & Vedação", value: "850.00", status: "Em Andamento", date: "18/07/2026", notes: "Aparelho deixado com película trincada." },
    { id: "OS-1093", tenantId, clientId: cli2.id, deviceName: "Notebook Dell Inspiron", serviceType: "Substituição de Teclado e Limpeza", value: "320.00", status: "Pendente", date: "18/07/2026", notes: "Algumas teclas não funcionam." },
    { id: "OS-1092", tenantId, clientId: cli3.id, deviceName: "PlayStation 5", serviceType: "Recondicionamento de Conector HDMI", value: "450.00", status: "Concluído", date: "17/07/2026", notes: "Sem sinal de vídeo ao ligar." },
    { id: "OS-1091", tenantId, clientId: cli4.id, deviceName: "Galaxy S22 Ultra", serviceType: "Troca de Vidro Traseiro e Bateria", value: "580.00", status: "Concluído", date: "16/07/2026", notes: "Tampa traseira quebrada por queda." },
  ]);

  // Seed Quotes
  await db.insert(quotes).values([
    { id: "ORC-5012", tenantId, clientId: cli1.id, deviceName: "iPhone 13 Pro", description: "Troca de Tela + Vedação Oring", value: "850.00", status: "Pendente", validUntil: "25/07/2026" },
    { id: "ORC-5011", tenantId, clientId: cli2.id, deviceName: "Notebook Dell Inspiron", description: "Substituição de Teclado e Bateria de Lítio", value: "450.00", status: "Aprovado", validUntil: "24/07/2026" },
    { id: "ORC-5010", tenantId, clientId: cli3.id, deviceName: "Sony PlayStation 5", description: "Reparo HDMI + Troca de Metal Líquido", value: "550.00", status: "Rejeitado", validUntil: "15/07/2026" },
  ]);

  // Seed Parts
  await db.insert(parts).values([
    { sku: "PEC-2001", tenantId, name: "Tela Frontal iPhone 13 (OLED)", category: "Telas", quantity: 12, minQuantity: 5, price: "549.90" },
    { sku: "PEC-2002", tenantId, name: "Bateria Notebook Dell Inspiron", category: "Baterias", quantity: 3, minQuantity: 4, price: "280.00" },
    { sku: "PEC-2003", tenantId, name: "Conector de Carga USB-C Galaxy S22", category: "Conectores", quantity: 2, minQuantity: 10, price: "45.00" },
    { sku: "PEC-2004", tenantId, name: "Pasta Térmica Arctic MX-4 (4g)", category: "Insumos", quantity: 45, minQuantity: 20, price: "65.00" },
  ]);

  // Seed Sales
  await db.insert(sales).values([
    { id: "VEN-3094", tenantId, clientId: cli1.id, paymentMethod: "Pix", amount: "450.00", date: "18/07/2026" },
    { id: "VEN-3093", tenantId, clientId: cli3.id, paymentMethod: "Cartão", amount: "180.00", date: "17/07/2026" },
  ]);

  // Seed Employees
  await db.insert(employees).values([
    { id: "FUN-01", tenantId, name: "Adriano Souza", role: "Técnico de Placas", email: "adriano.s@oficina.com", phone: "(11) 98122-1022", status: "Ativo" },
    { id: "FUN-02", tenantId, name: "Tiago Lacerda", role: "Técnico de Smartphones", email: "tiago.l@oficina.com", phone: "(11) 99345-8822", status: "Ativo" },
    { id: "FUN-03", tenantId, name: "Renata Oliveira", role: "Atendimento & Triagem", email: "renata.o@oficina.com", phone: "(11) 97433-2940", status: "Ativo" },
  ]);

  // Seed Cash Logs
  await db.insert(cashLogs).values([
    { tenantId, type: "Abertura", description: "Fundo de caixa inicial", value: "300.00", time: "08:00" },
    { tenantId, type: "Venda", description: "Recebimento OS-1092 - PS5", value: "450.00", time: "09:30" },
    { tenantId, type: "Suprimento", description: "Troco adicional em moedas", value: "50.00", time: "11:00" },
    { tenantId, type: "Sangria", description: "Retirada para Correios", value: "-40.00", time: "14:15" },
  ]);

  // Seed Goals
  await db.insert(goals).values([
    { tenantId, name: "Faturamento Bruto", category: "Financeiro", current: "65000.00", target: "80000.00", unit: "R$", deadline: "31/07/2026" },
    { tenantId, name: "Ordens de Serviço Concluídas", category: "Operacional", current: "124.00", target: "150.00", unit: "OS", deadline: "31/07/2026" },
    { tenantId, name: "Satisfação do Cliente (NPS)", category: "Qualidade", current: "88.00", target: "95.00", unit: "%", deadline: "31/12/2026" },
    { tenantId, name: "Retrabalho Operacional", category: "Redução", current: "2.00", target: "5.00", unit: "%", deadline: "31/07/2026" },
  ]);
}
