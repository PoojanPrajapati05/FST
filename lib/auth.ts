import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "MEMBER",
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || "splitease_super_secret_session_key_2026_jwt_auth_12345",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type AuthSession = typeof auth.$Infer.Session;

export async function getServerSession() {
  const reqHeaders = await headers();
  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

export async function requireUser() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to continue.");
  }
  return session.user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  const role = (user.role as Role) || Role.MEMBER;
  if (!allowedRoles.includes(role)) {
    throw new Error("Forbidden: You lack permissions for this resource.");
  }
  return { ...user, role };
}
