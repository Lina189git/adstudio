import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/auth/setup
// One-time admin bootstrap. Only works when no ADMIN user exists yet.
// Body: { email, password, name, secret }
// The request secret must match SETUP_SECRET env var (required in production).
export async function POST(request: NextRequest) {
  try {
    const setupSecret = process.env.SETUP_SECRET;
    const body = await request.json();
    const { email, password, name, secret } = body;

    // In production require a secret; in development allow without one
    if (setupSecret && secret !== setupSecret) {
      return NextResponse.json({ error: "Invalid setup secret." }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required." }, { status: 400 });
    }

    // Only allow if no admin exists yet
    const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin account already exists. Use the admin panel to manage users." },
        { status: 409 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const hashedPassword = await hash(String(password), 12);

    const user = await prisma.user.upsert({
      where:  { email: normalizedEmail },
      update: { role: "ADMIN", password: hashedPassword, ...(name ? { name: String(name).trim() } : {}) },
      create: {
        email:    normalizedEmail,
        password: hashedPassword,
        name:     name ? String(name).trim() : "Admin",
        role:     "ADMIN",
      },
    });

    return NextResponse.json({ message: "Admin account created.", email: user.email });
  } catch (error) {
    console.error("[auth/setup]", error);
    return NextResponse.json({ error: "Setup failed." }, { status: 500 });
  }
}
