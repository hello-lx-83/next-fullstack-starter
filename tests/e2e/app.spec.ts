import { expect, type Page, test } from "@playwright/test";

async function openAdminUserSettings(page: Page) {
  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await page.getByRole("menuitem", { name: "设置", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/profile$/);
  await page.getByRole("link", { name: "用户", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/users$/);
}

test("健康检查可用，未登录用户会被重定向到登录页", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toEqual({ status: "ok", database: "ok" });
  expect(health.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);

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
  await expect(page.getByRole("link", { name: "用户" })).toHaveCount(0);

  const themeSwitcher = page.getByRole("button", { name: "切换到深色模式" });
  await expect(themeSwitcher).toBeVisible();
  await themeSwitcher.click();
  await expect(page.getByRole("button", { name: "切换到浅色模式" })).toBeVisible();

  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await expect(page.getByRole("menuitem", { name: "设置", exact: true })).toHaveCount(1);
  await expect(page.getByRole("menuitem", { name: "外观", exact: true })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /切换主题/ })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await openAdminUserSettings(page);
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

  await openAdminUserSettings(page);
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
  await expect(page).toHaveURL(/\/dashboard\/settings\/audit$/);
  await expect(page.getByRole("table").getByText("管理员重置密码", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "安全", exact: true }).click();
  await expect(page.getByText("当前会话", { exact: true })).toBeVisible();

  await page.goto("/dashboard/profile");
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

  await openAdminUserSettings(page);
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
  await userPage.goto("/dashboard/settings/users");
  await expect(userPage).toHaveURL(/\/unauthorized$/);
  await userPage.goto("/dashboard/settings/audit");
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
  await expect(page.getByText("隔离用户", { exact: true })).toBeVisible();

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
