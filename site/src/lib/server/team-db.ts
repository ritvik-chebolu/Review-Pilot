import { execSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

let localDb: DatabaseSync | null = null;

function getLocalDb(): DatabaseSync {
  if (!localDb) {
    const dbPath = "c:/RITvik/Projects/Review-Pilot/reviewpilot.db";
    localDb = new DatabaseSync(dbPath);
    
    // Auto-initialize schema if the tables do not exist
    try {
      const schemaSql = readFileSync("c:/RITvik/Projects/Review-Pilot/schema.sql", "utf8");
      schemaSql.split(";").forEach((stmt) => {
        if (stmt.trim()) {
          localDb!.exec(stmt);
        }
      });
    } catch (err: any) {
      console.error("[DB] Failed to auto-initialize schema:", err.message);
    }
  }
  return localDb;
}

/**
 * Execute a single SQL statement via the team-db CLI, with a local SQLite fallback.
 */
export function teamDbExec(sql: string): unknown {
  try {
    const output = execSync(`team-db ${JSON.stringify(sql)}`, {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(output.trim());
  } catch {
    // Fallback to native node:sqlite
    try {
      const db = getLocalDb();
      const trimmed = sql.trim();
      if (trimmed.toUpperCase().startsWith("SELECT")) {
        const stmt = db.prepare(trimmed);
        return stmt.all();
      } else {
        db.exec(trimmed);
        return [];
      }
    } catch (localErr: any) {
      console.error("[DB Error] Local SQLite execution failed:", localErr.message);
      return null;
    }
  }
}