import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

async function openAdminUsers(page: Page) {
  await page.getByRole("link", { name: "用户", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/users$/);
}

test("健康检查可用，未登录用户会被重定向到登录页", async ({ page, request }) => {
  const [live, ready] = await Promise.all([request.get("/api/health/live"), request.get("/api/health/ready")]);
  expect(live.status()).toBe(200);
  expect(ready.status()).toBe(200);
  await expect(live.json()).resolves.toEqual({ status: "ok" });
  await expect(ready.json()).resolves.toEqual({ status: "ok", database: "ok" });
  expect(ready.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(ready.headers()["x-content-type-options"]).toBe("nosniff");
  expect(ready.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);

  await page.goto("/dashboard/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fprojects/);
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
});

test("管理员可以登录并完成项目 CRUD", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "用户", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "审计日志", exact: true })).toBeVisible();

  const themeSwitcher = page.getByRole("button", { name: "切换到深色模式" });
  await expect(themeSwitcher).toBeVisible();
  await themeSwitcher.click();
  await expect(page.getByRole("button", { name: "切换到浅色模式" })).toBeVisible();

  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await expect(page.getByRole("menuitem", { name: "设置", exact: true })).toHaveCount(1);
  await expect(page.getByRole("menuitem", { name: "外观", exact: true })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /切换主题/ })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await openAdminUsers(page);
  await expect(page.getByRole("heading", { name: "用户", exact: true })).toBeVisible();

  const secondAdmin = await page.request.post("/api/auth/admin/create-user", {
    data: {
      email: "second-admin@example.com",
      name: "第二个管理员",
      password: "AdminPass123!",
      role: "admin",
    },
    headers: { origin: "http://localhost:3100" },
  });
  expect(secondAdmin.status()).toBe(403);

  await page.getByRole("link", { name: "项目", exact: true }).click();
  await page.getByRole("button", { name: "新建项目" }).click();
  await page.getByLabel("名称").fill("E2E 项目");
  await page.getByLabel("描述").fill("由 Playwright 创建");
  await page.getByRole("button", { name: "创建", exact: true }).click();
  await expect(page.getByText("E2E 项目", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "打开“E2E 项目”的操作菜单" }).click();
  await page.getByRole("menuitem", { name: "编辑" }).click();
  await page.getByLabel("名称").fill("E2E 项目（已编辑）");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("E2E 项目（已编辑）", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "打开“E2E 项目（已编辑）”的操作菜单" }).click();
  await page.getByRole("menuitem", { name: "归档" }).click();
  await expect(page.getByText("已归档", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "打开“E2E 项目（已编辑）”的操作菜单" }).click();
  await page.getByRole("menuitem", { name: "删除" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("E2E 项目（已编辑）")).toHaveCount(0);

  await openAdminUsers(page);
  await page.getByRole("button", { name: "创建用户" }).click();
  await page.getByLabel("姓名").fill("普通用户");
  await page.getByLabel("邮箱").fill("user@example.com");
  await page.getByLabel("初始密码").fill("UserPass123!");
  await page.getByRole("button", { name: "创建", exact: true }).click();
  const userRow = page.getByRole("row").filter({ hasText: "user@example.com" });
  await expect(userRow).toBeVisible();
  await expect(userRow.getByText("普通用户", { exact: true }).last()).toBeVisible();
  await userRow.getByRole("button", { name: "停用" }).click();
  await page.getByRole("button", { name: "确认停用" }).click();
  await expect(userRow.getByRole("button", { name: "启用" })).toBeVisible();
  await userRow.getByRole("button", { name: "启用" }).click();
  await expect(userRow.getByRole("button", { name: "停用" })).toBeVisible();
  await userRow.getByRole("button", { name: "重置密码" }).click();
  await page.getByLabel("新密码", { exact: true }).fill("ResetPass123!");
  await page.getByLabel("确认新密码").fill("ResetPass123!");
  await page.getByRole("button", { name: "重置并撤销会话" }).click();
  await expect(page.getByText("密码已重置，用户的所有会话已撤销")).toBeVisible();

  await page.getByRole("link", { name: "审计日志" }).click();
  await expect(page).toHaveURL(/\/dashboard\/audit$/);
  await expect(page.getByRole("table").getByText("管理员重置密码", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await page.getByRole("menuitem", { name: "设置", exact: true }).click();
  const settingsNavigation = page.getByRole("navigation", { name: "设置导航" });
  await expect(settingsNavigation.getByRole("link", { name: "用户", exact: true })).toHaveCount(0);
  await expect(settingsNavigation.getByRole("link", { name: "审计日志", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "安全", exact: true }).click();
  await expect(page.getByText("当前会话", { exact: true })).toBeVisible();

  await page.goto("/dashboard/settings/profile");
  await expect(page).toHaveURL(/\/dashboard\/settings\/profile$/);
  await page.getByLabel("姓名").fill("测试管理员更新");
  await page.getByRole("button", { name: "保存资料" }).click();
  await expect(page.getByText("个人资料已保存")).toBeVisible();
});

test("普通用户只能操作自己的项目，管理员可查看全部项目", async ({ browser, page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await openAdminUsers(page);
  await page.getByRole("button", { name: "创建用户" }).click();
  await page.getByLabel("姓名").fill("隔离用户");
  await page.getByLabel("邮箱").fill("isolated-user@example.com");
  await page.getByLabel("初始密码").fill("UserPass123!");
  await page.getByRole("button", { name: "创建", exact: true }).click();
  await expect(page.getByText("isolated-user@example.com")).toBeVisible();

  await page.getByRole("link", { name: "项目", exact: true }).click();
  await page.getByRole("button", { name: "新建项目" }).click();
  await page.getByLabel("名称").fill("隔离管理员项目");
  await page.getByRole("button", { name: "创建", exact: true }).click();
  await expect(page.getByText("隔离管理员项目")).toBeVisible();

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  await userPage.goto("/login");
  await userPage.getByLabel("邮箱").fill("isolated-user@example.com");
  await userPage.getByLabel("密码").fill("UserPass123!");
  await userPage.getByRole("button", { name: "登录" }).click();
  await expect(userPage).toHaveURL(/\/dashboard$/);
  await expect(userPage.getByRole("link", { name: "用户", exact: true })).toHaveCount(0);

  await userPage.goto("/dashboard/settings/profile");
  await expect(userPage.getByRole("link", { name: "用户", exact: true })).toHaveCount(0);
  await expect(userPage.getByRole("link", { name: "审计日志", exact: true })).toHaveCount(0);
  await userPage.goto("/dashboard/users");
  await expect(userPage).toHaveURL(/\/unauthorized$/);
  await userPage.goto("/dashboard/audit");
  await expect(userPage).toHaveURL(/\/unauthorized$/);

  await userPage.goto("/dashboard/projects");
  await userPage.getByRole("button", { name: "新建项目" }).click();
  await userPage.getByLabel("名称").fill("普通用户项目");
  await userPage.getByRole("button", { name: "创建", exact: true }).click();
  await expect(userPage.getByText("普通用户项目")).toBeVisible();
  await expect(userPage.getByText("隔离管理员项目")).toHaveCount(0);
  await userPage.waitForLoadState("networkidle");
  await userContext.close();

  await page.goto("/dashboard/projects");
  await expect(page.getByText("普通用户项目")).toBeVisible();
  await expect(page.getByRole("cell", { name: "隔离用户", exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "搜索项目" }).fill("普通用户项目");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\?q=%E6%99%AE%E9%80%9A%E7%94%A8%E6%88%B7%E9%A1%B9%E7%9B%AE$/);
  await expect(page.getByText("普通用户项目")).toBeVisible();
  await expect(page.getByText("隔离管理员项目")).toHaveCount(0);
  await page.getByRole("button", { name: "重置" }).click();
  await expect(page.getByText("隔离管理员项目")).toBeVisible();

  await expect(page.getByLabel("每页项目数")).toBeVisible();
  await expect(page.getByText("第 1 / 1 页")).toBeVisible();
  await expect(page.getByRole("link", { name: "前往上一页" })).toBeVisible();
  await expect(page.getByRole("link", { name: "前往下一页" })).toBeVisible();
  await expect(page.getByText("上一页", { exact: true })).toBeVisible();
  await expect(page.getByText("下一页", { exact: true })).toBeVisible();
  await expect(page.getByText("Previous", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Next", { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("link", { name: "前往上一页" })).toBeVisible();
  await expect(page.getByRole("link", { name: "前往下一页" })).toBeVisible();
  await expect(page.getByText("上一页", { exact: true })).toBeHidden();
  await expect(page.getByText("下一页", { exact: true })).toBeHidden();
});

test("登录接口会对连续失败请求限流", async ({ request }) => {
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request.post("/api/auth/sign-in/email", {
      data: { email: "missing@example.com", password: "WrongPass123!" },
      headers: { origin: "http://localhost:3100", "x-forwarded-for": "127.0.0.99" },
    });
    statuses.push(response.status());
  }

  expect(statuses.slice(0, 5)).not.toContain(429);
  expect(statuses[5]).toBe(429);
});

test("用户列表支持搜索、筛选、分页和删除后的页码回退", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  for (let i = 0; i < 11; i += 1) {
    const response = await page.request.post("/api/auth/admin/create-user", {
      data: {
        email: `paging-${i}@example.com`,
        name: `分页测试${String(i).padStart(2, "0")}`,
        password: "UserPass123!",
      },
      headers: { origin: "http://localhost:3100" },
    });
    expect(response.ok(), await response.text()).toBe(true);
  }
  await page.goto("/dashboard/users");
  await page.getByRole("textbox", { name: "搜索用户" }).fill("分页测试");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /^共/ })).toContainText("共 11 位用户");
  await page.getByRole("combobox", { name: "每页用户数" }).click();
  await page.getByRole("option", { name: "每页 10 条" }).click();
  await expect(page.getByText("第 1 / 2 页")).toBeVisible();
  await page.getByRole("combobox", { name: "用户排序" }).click();
  await page.getByRole("option", { name: "姓名升序" }).click();
  await expect(page.getByRole("table", { name: "用户列表" }).getByRole("row")).toHaveCount(11);
  await page.screenshot({ path: testInfo.outputPath("users-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "前往下一页" }).click();
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();
  await expect(page.getByRole("table", { name: "用户列表" }).getByRole("row")).toHaveCount(2);
  await page
    .getByRole("row")
    .filter({ hasText: "paging-10@example.com" })
    .getByRole("button", { name: "删除", exact: true })
    .click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("第 1 / 1 页")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /^共/ })).toContainText("共 10 位用户");
  await page.getByRole("combobox", { name: "筛选用户角色" }).click();
  await page.getByRole("option", { name: "管理员", exact: true }).click();
  await expect(page.getByText("没有匹配的用户")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(page.getByRole("textbox", { name: "搜索用户" })).toHaveValue("");
  await page.getByRole("textbox", { name: "搜索用户" }).fill("PAGING-0@EXAMPLE.COM");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "paging-0@example.com" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "停用", exact: true }).click();
  await page.getByRole("button", { name: "确认停用" }).click();
  await page.getByRole("combobox", { name: "筛选用户状态" }).click();
  await page.getByRole("option", { name: "已停用", exact: true }).click();
  await expect(row).toBeVisible();
  await page.reload();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "启用", exact: true }).click();
  await expect(page.getByText("没有匹配的用户")).toBeVisible();
  await page.goto("/dashboard/users?q=nonexistent-user&page=999");
  await expect(page).toHaveURL("/dashboard/users?q=nonexistent-user");
  await expect(page.getByText("第 1 / 1 页")).toBeVisible();
});
