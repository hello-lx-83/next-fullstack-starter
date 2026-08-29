import { expect, test } from "@playwright/test";

test("移动端可打开登录页", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
});

test("移动端可从导航进入设置", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "切换导航" }).click();
  await expect(page.getByRole("link", { name: "项目", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await page.getByRole("menuitem", { name: "设置", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard\/settings\/profile$/);
  await expect(page.getByRole("heading", { name: "个人资料" })).toBeVisible();
  await page.getByRole("button", { name: "个人资料" }).click();
  await page.getByRole("menuitem", { name: "数据与备份" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/data$/);
  await expect(page.getByRole("heading", { name: "数据与备份" })).toBeVisible();
});

test("移动端项目列表无需横向滚动即可完成操作", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/projects");
  await page.getByRole("button", { name: "新建项目" }).click();
  await page.getByLabel("名称").fill("移动端项目");
  await page.getByLabel("描述").fill("用于验证响应式项目列表");
  await page.getByRole("button", { name: "创建", exact: true }).click();

  const projectTable = page.getByRole("table", { name: "项目列表" });
  await expect(projectTable).toBeVisible();
  await expect(projectTable.getByText("移动端项目", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "打开“移动端项目”的操作菜单" })).toBeVisible();
  await expect(page.getByRole("button", { name: "显示列" })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
});
