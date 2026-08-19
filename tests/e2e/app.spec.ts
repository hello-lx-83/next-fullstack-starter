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
  });
  expect(secondAdmin.status()).toBe(403);

  await page.getByRole("link", { name: "项目", exact: true }).click();
  await page.getByRole("button", { name: "新建项目" }).click();
  await page.getByLabel("项目名称").fill("E2E 项目");
  await page.getByLabel("项目描述").fill("由 Playwright 创建");
  await page.getByRole("button", { name: "创建", exact: true }).click();
  await expect(page.getByText("E2E 项目")).toBeVisible();

  await page.getByRole("button", { name: "归档" }).click();
  await page.getByRole("button", { name: "确认归档" }).click();
  await expect(page.getByText("已归档", { exact: true })).toBeVisible();

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
  await page.getByLabel("项目名称").fill("隔离管理员项目");
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
  await userPage.goto("/dashboard/projects");
  await userPage.getByRole("button", { name: "新建项目" }).click();
  await userPage.getByLabel("项目名称").fill("普通用户项目");
  await userPage.getByRole("button", { name: "创建", exact: true }).click();
  await expect(userPage.getByText("普通用户项目")).toBeVisible();
  await expect(userPage.getByText("隔离管理员项目")).toHaveCount(0);
  await userPage.waitForLoadState("networkidle");
  await userContext.close();

  await page.goto("/dashboard/projects");
  await expect(page.getByText("普通用户项目")).toBeVisible();
  await expect(page.getByText("隔离用户", { exact: true })).toBeVisible();
});
