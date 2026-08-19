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
});
