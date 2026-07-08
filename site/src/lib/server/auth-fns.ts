import { createServerFn } from "@tanstack/react-start";
import { v4 as uuidv4 } from "uuid";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  findUserByEmail,
  findUserById,
  getUserPasswordHash,
  createUser,
  emailExists,
} from "./auth-utils";

export interface AuthResult {
  ok: boolean;
  error?: string;
  token?: string;
  user?: { id: string; email: string; name: string };
}

export const serverSignup = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string; name: string })
  .handler(async ({ data }): Promise<AuthResult> => {
    const { email, password, name } = data;

    if (!email || !password || !name) {
      return { ok: false, error: "Email, password, and name are required" };
    }
    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters" };
    }
    if (emailExists(email)) {
      return { ok: false, error: "An account with this email already exists" };
    }

    const id = uuidv4();
    const pwHash = await hashPassword(password);
    createUser(id, email, name.trim(), pwHash);

    // Auto-create starter subscription
    const subId = uuidv4();
    const now = new Date().toISOString();
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    teamDbExec(
      `INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
       VALUES ('${subId}', '${id}', 'starter', 'active', '${now}', '${oneMonthLater}')`
    );

    const user = findUserByEmail(email);
    if (!user) {
      return { ok: false, error: "Failed to create user" };
    }

    const token = createToken(user);
    return {
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  });

export const serverLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string })
  .handler(async ({ data }): Promise<AuthResult> => {
    const { email, password } = data;

    if (!email || !password) {
      return { ok: false, error: "Email and password are required" };
    }

    const hash = getUserPasswordHash(email);
    if (!hash) {
      return { ok: false, error: "Invalid email or password" };
    }

    const valid = await verifyPassword(password, hash);
    if (!valid) {
      return { ok: false, error: "Invalid email or password" };
    }

    const user = findUserByEmail(email);
    if (!user) {
      return { ok: false, error: "User not found" };
    }

    const token = createToken(user);
    return {
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  });

export const serverGetMe = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { token: string })
  .handler(async ({ data }): Promise<{ user: { id: string; email: string; name: string } } | null> => {
    const payload = verifyToken(data.token);
    if (!payload) return null;

    const user = findUserById(payload.userId);
    if (!user) return null;

    return { user: { id: user.id, email: user.email, name: user.name } };
  });

export const serverValidateToken = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { token: string })
  .handler(async ({ data }): Promise<boolean> => {
    return verifyToken(data.token) !== null;
  });