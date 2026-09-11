import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as Schema from "./schema";

let db: BetterSQLite3Database<typeof Schema>;
let schema: typeof Schema;
let getRecentMessages: typeof import("./queries").getRecentMessages;
let updateMember: typeof import("./queries").updateMember;

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";

  schema = await import("./schema");
  const dbModule = await import("./index");
  const queries = await import("./queries");

  db = dbModule.getDb();
  getRecentMessages = queries.getRecentMessages;
  updateMember = queries.updateMember;

  db.$client.exec(`
    CREATE TABLE rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      repo_path TEXT NOT NULL,
      engine TEXT NOT NULL DEFAULT 'claude',
      sort_order INTEGER NOT NULL DEFAULT 0,
      context TEXT,
      api_key TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      member_id INTEGER,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
});

beforeEach(() => {
  db.delete(schema.messages).run();
  db.delete(schema.members).run();
  db.delete(schema.rooms).run();
});

describe("getRecentMessages", () => {
  it("returns the newest messages in chronological order", () => {
    const room = db
      .insert(schema.rooms)
      .values({ name: "Long room" })
      .returning()
      .get();

    const baseTime = Date.UTC(2026, 0, 1);
    db.insert(schema.messages)
      .values(
        Array.from({ length: 35 }, (_, index) => ({
          roomId: room.id,
          role: "user" as const,
          memberId: null,
          content: `message ${index + 1}`,
          createdAt: new Date(baseTime + index * 1000),
        }))
      )
      .run();

    const recent = getRecentMessages(room.id, 30);

    expect(recent).toHaveLength(30);
    expect(recent[0].content).toBe("message 6");
    expect(recent.at(-1)?.content).toBe("message 35");
  });
});

describe("updateMember", () => {
  it("updates editable agent settings without recreating the agent", () => {
    const room = db
      .insert(schema.rooms)
      .values({ name: "Editable room" })
      .returning()
      .get();
    const member = db
      .insert(schema.members)
      .values({
        roomId: room.id,
        name: "Old name",
        repoPath: "C:\\Projects\\old",
        engine: "claude",
      })
      .returning()
      .get();

    const updated = updateMember(member.id, {
      name: "Frontend Agent",
      repoPath: "C:\\Projects\\new",
      context: "Own the interface.",
    });

    expect(updated.id).toBe(member.id);
    expect(updated.name).toBe("Frontend Agent");
    expect(updated.repoPath).toBe("C:\\Projects\\new");
    expect(updated.context).toBe("Own the interface.");
  });
});
