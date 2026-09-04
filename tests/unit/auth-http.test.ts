import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAuth } from "@/server/auth";
import { handleAuthRequest } from "@/server/auth/http";
import { db, sqlite } from "@/server/db";

const base = "http://localhost:3009";
let cookie: string;
beforeAll(async () => {
  migrate(db, { migrationsFolder: "drizzle" });
  const bootstrap = createAuth({ allowSignUp: true });
  await bootstrap.api.signUpEmail({ body: { email: "admin@example.com", name: "管理员", password: "AdminPass123!" } });
  sqlite.exec("UPDATE user SET role = 'admin'");
  const login = await handleAuthRequest(
    new Request(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: base },
      body: JSON.stringify({ email: "admin@example.com", password: "AdminPass123!" }),
    }),
  );
  expect(login.status).toBe(200);
  cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
});
afterAll(() => sqlite.close());
describe("认证 HTTP 边界", () => {
  it.each([
    "admin/create-user",
    "admin/set-user-password",
    "change-password",
    "update-user",
    "revoke-session",
    "sign-up/email",
    "admin/create-user/",
    "admin/%63reate-user",
  ])("管理员也不能绕过业务流程调用 %s", async (path) => {
    const before = sqlite.prepare("SELECT COUNT(*) AS count FROM user").get();
    const result = await handleAuthRequest(
      new Request(`${base}/api/auth/${path}`, {
        method: "POST",
        headers: { cookie, origin: base, "content-type": "application/json" },
        body: JSON.stringify({ email: "bypass@example.com", name: "绕过", password: "Bypass123!" }),
      }),
    );
    expect(result.status).toBe(403);
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM user").get()).toEqual(before);
  });
  it("保留会话读取和登出", async () => {
    const response = await handleAuthRequest(new Request(`${base}/api/auth/get-session`, { headers: { cookie } }));
    expect((await response.json()).user.email).toBe("admin@example.com");
    const logout = await handleAuthRequest(
      new Request(`${base}/api/auth/sign-out`, {
        method: "POST",
        headers: { cookie, origin: base, "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(logout.status).toBe(200);
    const expired = await handleAuthRequest(new Request(`${base}/api/auth/get-session`, { headers: { cookie } }));
    expect(await expired.json()).toBeNull();
  });
});
