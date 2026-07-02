import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { teamDbExec } from "./team-db";

// In production, read this from an env var.
const JWT_SECRET = process.env.JWT_SECRET ?? "reviewpilot-dev-secret-change-in-prod";
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12;

export interface User {
  id: string;
  email: string;
  name: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

// ── Password hashing ──

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ──

export function createToken(user: { id: string; email: string }): string {
  const payload: JwtPayload = { userId: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Database helpers ──

export function findUserByEmail(email: string): User | null {
  const result = teamDbExec(
    `SELECT id, email, name, stripe_customer_id, created_at FROM users WHERE email = ${JSON.stringify(email)}`
  ) as Record<string, string>[] | null;
  if (!result || result.length === 0) return null;
  return result[0] as unknown as User;
}

export function findUserById(id: string): User | null {
  const result = teamDbExec(
    `SELECT id, email, name, stripe_customer_id, created_at FROM users WHERE id = ${JSON.stringify(id)}`
  ) as Record<string, string>[] | null;
  if (!result || result.length === 0) return null;
  return result[0] as unknown as User;
}

export function getUserPasswordHash(email: string): string | null {
  const result = teamDbExec(
    `SELECT password_hash FROM users WHERE email = ${JSON.stringify(email)}`
  ) as { password_hash: string }[] | null;
  if (!result || result.length === 0) return null;
  return result[0].password_hash;
}

export function createUser(
  id: string,
  email: string,
  name: string,
  passwordHash: string
): boolean {
  const escapedEmail = JSON.stringify(email);
  const escapedName = JSON.stringify(name);
  const escapedHash = JSON.stringify(passwordHash);
  const escapedId = JSON.stringify(id);

  teamDbExec(
    `INSERT INTO users (id, email, name, password_hash) VALUES (${escapedId}, ${escapedEmail}, ${escapedName}, ${escapedHash})`
  );
  return true;
}

export function emailExists(email: string): boolean {
  return findUserByEmail(email) !== null;
}