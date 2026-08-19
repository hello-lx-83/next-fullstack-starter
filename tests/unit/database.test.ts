import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/server/db";

describe("SQLite 连接", () => {
  const connections: ReturnType<typeof createDatabase>[] = [];

  afterEach(() => {
    for (const connection of connections) connection.sqlite.close();
    connections.length = 0;
  });

  it("启用外键、等待锁并通过完整性检查", () => {
    const connection = createDatabase(":memory:");
    connections.push(connection);

    expect(connection.sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(connection.sqlite.pragma("busy_timeout", { simple: true })).toBe(5000);
    expect(connection.sqlite.pragma("quick_check", { simple: true })).toBe("ok");
  });
});
