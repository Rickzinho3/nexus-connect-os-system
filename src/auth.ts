import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      // First, run the base jwt callback from authConfig
      let token = params.token;
      if (authConfig.callbacks?.jwt) {
        token = await (authConfig.callbacks.jwt as any)(params);
      }
      
      // Always fetch fresh role & tenantId from DB to stay in sync
      const empId = token.id as string | undefined;
      if (empId) {
        const emp = await db.query.employees.findFirst({
          where: eq(employees.id, empId),
        });
        if (emp) {
          token.role = emp.role;
          token.tenantId = emp.tenantId;
          token.name = emp.name;
        }
      }
      return token;
    },
    async session(params) {
      // First run base session callback
      let session = params.session;
      if (authConfig.callbacks?.session) {
        session = await (authConfig.callbacks.session as any)(params);
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        cpfCnpj: { label: "CPF/CNPJ", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log("AUTHORIZE CALL RECEIVED", credentials);
        if (!credentials?.cpfCnpj || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const rawCpf = credentials.cpfCnpj as string;
        const cleanCpf = rawCpf.trim();

        const employee = await db.query.employees.findFirst({
          where: eq(employees.cpfCnpj, cleanCpf),
        });

        console.log("EMPLOYEE FOUND:", employee ? employee.id : "NO");

        if (!employee) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          employee.password
        );

        console.log("PASSWORD MATCH:", passwordsMatch);

        if (passwordsMatch) {
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
          };
        }

        return null;
      },
    }),
  ],
});

