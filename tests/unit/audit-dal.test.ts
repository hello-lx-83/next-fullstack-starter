import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auditListHref, parseAuditListQuery } from "@/features/audit/schema";
import { requireAdmin } from "@/server/auth/session";
import { listAuditEvents } from "@/server/dal/audit";
import { createDatabase } from "@/server/db";
import { auditEvent, user } from "@/server/db/schema";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/server/auth/session", () => ({ requireAdmin: vi.fn() }));

describe("审计列表", () => {
  let database: ReturnType<typeof createDatabase>;
  beforeEach(async () => {
    database = createDatabase(":memory:");
    for (const file of ["0000_abandoned_fat_cobra.sql", "0001_solid_tusk.sql"]) {
      database.sqlite.exec(readFileSync(resolve("drizzle", file), "utf8").replaceAll("--> statement-breakpoint", ""));
    }
    await database.db.insert(user).values({ id: "actor", name: "审计管理员", email: "audit@example.com" });
    await database.db.insert(auditEvent).values(
      Array.from({ length: 23 }, (_, i) => ({
        id: `event-${String(i).padStart(2, "0")}`,
        action: i % 2 === 0 ? "user.created" : "project.deleted",
        outcome: i % 2 === 0 ? ("success" as const) : ("failure" as const),
        actorUserId: i === 0 ? null : "actor",
        targetId: i === 0 ? "100%target" : `target-${i}`,
        requestId: `request-${i}`,
        createdAt: new Date(1_700_000_000_000 + i * 1000),
      })),
    );
  });
  afterEach(() => database.sqlite.close());
  it("分页、时间排序和越界页码正确", async () => {
    const query = parseAuditListQuery({ pageSize: "10", sort: "created-asc" });
    const first = await listAuditEvents(query, database.db);
    const last = await listAuditEvents({ ...query, page: 999 }, database.db);
    expect(first.total).toBe(23);
    expect(first.events).toHaveLength(10);
    expect(first.events[0].id).toBe("event-00");
    expect(last.page).toBe(3);
    expect(last.events).toHaveLength(3);
    expect((await listAuditEvents({ ...query, sort: "created-desc" }, database.db)).events[0].id).toBe("event-22");
  });
  it("组合操作、结果和操作者搜索", async () => {
    const result = await listAuditEvents(
      parseAuditListQuery({ q: "AUDIT@EXAMPLE", action: "project.deleted", outcome: "failure" }),
      database.db,
    );
    expect(result.total).toBe(11);
    expect(result.events.every((event) => event.outcome === "failure")).toBe(true);
  });
  it("搜索目标和请求 ID，保留没有操作者的记录", async () => {
    const result = await listAuditEvents(parseAuditListQuery({ q: "%" }), database.db);
    expect(result.total).toBe(1);
    expect(result.events[0].actorName).toBeNull();
    expect((await listAuditEvents(parseAuditListQuery({ q: "request-22" }), database.db)).total).toBe(1);
    const empty = await listAuditEvents(parseAuditListQuery({ q: "不存在", page: "99" }), database.db);
    expect(empty).toMatchObject({ total: 0, page: 1, pageCount: 1, events: [] });
  });
  it("拒绝未授权读取", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("unauthorized"));
    await expect(listAuditEvents(parseAuditListQuery({}), database.db)).rejects.toThrow("unauthorized");
  });
  it("校验参数并完整保留链接条件", () => {
    expect(parseAuditListQuery({ pageSize: "999", page: "1e100", outcome: "invalid" })).toMatchObject({
      page: 1,
      pageSize: 20,
      outcome: "all",
    });
    const query = parseAuditListQuery({
      q: [" 姓名 & ID ", "ignored"],
      page: "2",
      pageSize: "10",
      outcome: "failure",
      action: "project.deleted",
      sort: "created-asc",
    });
    expect(
      parseAuditListQuery(Object.fromEntries(new URL(auditListHref(query), "http://localhost").searchParams)),
    ).toEqual(query);
  });
});
