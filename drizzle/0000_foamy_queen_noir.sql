CREATE TABLE "cash_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"value" numeric NOT NULL,
	"category" text DEFAULT 'Geral' NOT NULL,
	"payment_method" text DEFAULT 'Dinheiro' NOT NULL,
	"responsible" text DEFAULT 'Sistema' NOT NULL,
	"time" text NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" text DEFAULT 'Aberto' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"initial_value" numeric NOT NULL,
	"expected_value" numeric NOT NULL,
	"counted_value" numeric,
	"difference" numeric,
	"notes" text,
	"responsible" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cpf_cnpj" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"access_code" text NOT NULL,
	"status" text DEFAULT 'Ativo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"cpf_cnpj" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'Ativo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_cpf_cnpj_unique" UNIQUE("cpf_cnpj")
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'Pago' NOT NULL,
	"due_date" text,
	"payment_method" text,
	"responsible" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"current" numeric DEFAULT '0' NOT NULL,
	"target" numeric NOT NULL,
	"unit" text NOT NULL,
	"deadline" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"sku" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"price" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"device_name" text NOT NULL,
	"description" text NOT NULL,
	"value" numeric NOT NULL,
	"status" text DEFAULT 'Pendente' NOT NULL,
	"valid_until" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid,
	"payment_method" text NOT NULL,
	"amount" numeric NOT NULL,
	"description" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"device_name" text NOT NULL,
	"service_type" text NOT NULL,
	"value" numeric NOT NULL,
	"status" text DEFAULT 'Pendente' NOT NULL,
	"notes" text,
	"photos" jsonb,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"address" text,
	"phone" text,
	"email" text,
	"profile_photo" text,
	"tax_rate" numeric DEFAULT '12.5',
	"commission_rate" numeric DEFAULT '8.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_logs" ADD CONSTRAINT "cash_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_logs" ADD CONSTRAINT "cash_logs_session_id_cash_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;