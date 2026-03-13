import sqlite3 from "sqlite3";
import { SQLITE_PATH } from "../config/paths.js";
import { MutableAdminConfig } from "../config/schema.js";

function openDb(): sqlite3.Database {
  sqlite3.verbose();
  return new sqlite3.Database(SQLITE_PATH);
}

export async function initAdminDb(defaultConfig: MutableAdminConfig): Promise<void> {
  const db = openDb();

  await run(db, `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const existing = await get(db, "SELECT value FROM settings WHERE key = ?", ["admin_config"]);
  if (!existing) {
    await run(db, "INSERT INTO settings(key, value) VALUES (?, ?)", ["admin_config", JSON.stringify(defaultConfig)]);
  }

  db.close();
}

export async function readAdminConfigFromDb(): Promise<MutableAdminConfig | null> {
  const db = openDb();
  const row = await get(db, "SELECT value FROM settings WHERE key = ?", ["admin_config"]);
  db.close();
  if (!row?.value) return null;
  return JSON.parse(row.value as string) as MutableAdminConfig;
}

export async function writeAdminConfigToDb(config: MutableAdminConfig): Promise<void> {
  const db = openDb();
  await run(db, "UPDATE settings SET value = ? WHERE key = ?", [JSON.stringify(config), "admin_config"]);
  db.close();
}

function run(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function get(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as Record<string, unknown> | undefined);
    });
  });
}
