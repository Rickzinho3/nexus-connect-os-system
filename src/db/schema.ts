import { pgTable, uuid, text, integer, numeric, timestamp, serial, jsonb } from "drizzle-orm/pg-core";

// tenants (Assistências) table for future auth / SaaS expansion
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  profilePhoto: text("profile_photo"),
  taxRate: numeric("tax_rate").default("12.5"),
  commissionRate: numeric("commission_rate").default("8.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// clients table
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  accessCode: text("access_code").notNull().unique(), // unique public tracking code
  status: text("status").default("Ativo").notNull(), // Ativo, Inativo
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// serviceOrders (Ordens de Serviço) table
export const serviceOrders = pgTable("service_orders", {
  id: text("id").primaryKey(), // E.g., OS-1094
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  deviceName: text("device_name").notNull(), // E.g., iPhone 13 Pro
  serviceType: text("service_type").notNull(), // E.g., Troca de Tela
  value: numeric("value").notNull(),
  status: text("status").default("Pendente").notNull(), // Pendente, Em Andamento, Concluído, Cancelado
  notes: text("notes"),
  photos: jsonb("photos"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// quotes (Orçamentos) table
export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(), // E.g., ORC-5012
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  deviceName: text("device_name").notNull(),
  description: text("description").notNull(),
  value: numeric("value").notNull(),
  status: text("status").default("Pendente").notNull(), // Pendente, Aprovado, Rejeitado, Expirado
  validUntil: text("valid_until").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// parts (Componentes) table
export const parts = pgTable("parts", {
  sku: text("sku").primaryKey(), // E.g., PEC-2001
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  minQuantity: integer("min_quantity").default(0).notNull(),
  price: numeric("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// sales (Vendas) table
export const sales = pgTable("sales", {
  id: text("id").primaryKey(), // E.g., VEN-3094
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  paymentMethod: text("payment_method").notNull(), // Pix, Cartão, Dinheiro
  amount: numeric("amount").notNull(),
  description: text("description"), // O que foi vendido
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// employees (Funcionários) table
export const employees = pgTable("employees", {
  id: text("id").primaryKey(), // E.g., FUN-01
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }), // Null for Super Admin
  cpfCnpj: text("cpf_cnpj").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Super Admin, Dono, Atendente, Técnico
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").default("Ativo").notNull(), // Ativo, Férias, Afastado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// cashSessions table
export const cashSessions = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").default("Aberto").notNull(), // Aberto, Fechado
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  initialValue: numeric("initial_value").notNull(),
  expectedValue: numeric("expected_value").notNull(),
  countedValue: numeric("counted_value"),
  difference: numeric("difference"),
  notes: text("notes"),
  responsible: text("responsible").notNull(),
  date: text("date").notNull(),
});

// cashLogs (Caixa) table
export const cashLogs = pgTable("cash_logs", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: integer("session_id")
    .references(() => cashSessions.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Abertura, Suprimento, Sangria, Venda
  description: text("description").notNull(),
  value: numeric("value").notNull(),
  category: text("category").default("Geral").notNull(),
  paymentMethod: text("payment_method").default("Dinheiro").notNull(),
  responsible: text("responsible").default("Sistema").notNull(),
  time: text("time").notNull(),
  date: text("date").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// financialTransactions table
export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Receita, Despesa
  amount: numeric("amount").notNull(),
  category: text("category").notNull(), // Venda, OS, Peças, Sangria, Suprimento, Outros
  status: text("status").default("Pago").notNull(), // Pago, Pendente
  dueDate: text("due_date"),
  paymentMethod: text("payment_method"), // Pix, Cartão, Dinheiro
  responsible: text("responsible"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// goals (Metas) table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  current: numeric("current").default("0").notNull(),
  target: numeric("target").notNull(),
  unit: text("unit").notNull(), // E.g. R$, OS, %, etc.
  deadline: text("deadline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
