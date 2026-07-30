import Fastify from "fastify";
import cors from "@fastify/cors";
import Database from "better-sqlite3";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";

const dbPath = process.env.DATABASE_PATH ?? ".data/habits.sqlite";
const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    day TEXT NOT NULL,
    UNIQUE(habit_id, day)
  );
`);

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true });

  app.get("/api/habits", async () => {
    const habits = db.prepare("SELECT * FROM habits ORDER BY id").all();
    const checkIns = db.prepare("SELECT habit_id, day FROM check_ins").all();
    const byHabit = new Map();
    for (const c of checkIns as { habit_id: number; day: string }[]) {
      if (!byHabit.has(c.habit_id)) byHabit.set(c.habit_id, []);
      byHabit.get(c.habit_id).push(c.day);
    }
    return (habits as { id: number; name: string }[]).map((h) => ({
      ...h,
      days: byHabit.get(h.id) ?? [],
    }));
  });

  app.post("/api/habits", async (req, reply) => {
    const body = req.body as { name?: string };
    const name = body?.name?.trim();
    if (!name) return reply.status(400).send({ error: "name required" });
    const result = db.prepare("INSERT INTO habits (name) VALUES (?)").run(name);
    const row = db
      .prepare("SELECT * FROM habits WHERE id = ?")
      .get(result.lastInsertRowid);
    return reply.status(201).send(row);
  });

  app.delete("/api/habits/:id", async (req, reply) => {
    const id = parseInt((req.params as { id: string }).id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: "invalid id" });
    db.prepare("DELETE FROM check_ins WHERE habit_id = ?").run(id);
    const result = db.prepare("DELETE FROM habits WHERE id = ?").run(id);
    if (result.changes === 0)
      return reply.status(404).send({ error: "not found" });
    return { ok: true };
  });

  app.post("/api/habits/:id/check", async (req, reply) => {
    const id = parseInt((req.params as { id: string }).id, 10);
    const day = (req.body as { day?: string })?.day;
    if (isNaN(id) || !day || !/^\d{4}-\d{2}-\d{2}$/.test(day))
      return reply
        .status(400)
        .send({ error: "invalid id or day (YYYY-MM-DD)" });
    try {
      db.prepare("INSERT INTO check_ins (habit_id, day) VALUES (?, ?)").run(
        id,
        day,
      );
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === "SQLITE_CONSTRAINT")
        return reply.status(409).send({ error: "already checked" });
      throw e;
    }
    return { ok: true };
  });

  app.delete("/api/habits/:id/check", async (req, reply) => {
    const id = parseInt((req.params as { id: string }).id, 10);
    const day = (req.query as { day?: string }).day;
    if (isNaN(id) || !day)
      return reply.status(400).send({ error: "invalid id or day" });
    const result = db
      .prepare("DELETE FROM check_ins WHERE habit_id = ? AND day = ?")
      .run(id, day);
    return { ok: true, removed: result.changes > 0 };
  });

  const port = Number(process.env.PORT) || 4372;
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
