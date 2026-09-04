import { expect, test } from "./fixtures";
import { createUserThroughUi } from "./users";

test("移动端可打开登录页", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
});

test("移动端可从导航进入设置", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "切换导航" }).click();
  await expect(page.getByRole("link", { name: "项目", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "用户", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/users$/);
  await expect(page.getByRole("heading", { name: "用户", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "切换导航" }).click();
  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await page.getByRole("menuitem", { name: "设置", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard\/settings\/profile$/);
  await expect(page.getByRole("heading", { name: "个人资料" })).toBeVisible();
  await page.getByRole("button", { name: "个人资料" }).click();
  await page.getByRole("menuitem", { name: "外观", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/appearance$/);
  await expect(page.getByRole("heading", { name: "外观", exact: true })).toBeVisible();
  const settingsDialog = page.getByRole("dialog", { name: "设置", exact: true });
  await expect(settingsDialog).toBeVisible();
  const bounds = await settingsDialog.boundingBox();
  expect(bounds?.width).toBe(page.viewportSize()?.width);
  expect(bounds?.height).toBe(page.viewportSize()?.height);
  expect(await settingsDialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await settingsDialog.getByRole("combobox", { name: "主题色", exact: true }).click();
  await page.getByRole("option", { name: "蓝", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-color", "blue");
  await settingsDialog
    .getByRole("group", { name: "文字大小", exact: true })
    .getByRole("button", { name: "大", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await settingsDialog.getByRole("combobox", { name: "界面字体", exact: true }).click();
  await page.getByRole("option", { name: "系统默认", exact: true }).click();
  expect(await settingsDialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await settingsDialog.getByRole("heading", { name: "外观", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("settings-mobile.png") });
  await settingsDialog.getByRole("button", { name: "关闭设置" }).click();
  await expect(settingsDialog).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard\/users$/);
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

test("移动端用户列表可搜索筛选且无需横向滚动", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await createUserThroughUi(page, {
    email: "mobile-users@example.com",
    name: "移动端测试用户",
    password: "UserPass123!",
  });
  await page.goto("/dashboard/users");
  await page.getByRole("textbox", { name: "搜索用户" }).fill("mobile-users@example.com");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("table", { name: "用户列表" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /^共/ })).toContainText("共 1 位用户");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("users-mobile.png"), fullPage: true });
  await page.getByRole("combobox", { name: "筛选用户角色" }).click();
  await page.getByRole("option", { name: "管理员", exact: true }).click();
  await expect(page.getByText("没有匹配的用户")).toBeVisible();
});

test("移动端审计列表可筛选且无需横向滚动", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/audit");
  await expect(page.getByRole("table", { name: "审计日志列表" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("audit-mobile.png"), fullPage: false });
  await page.getByRole("combobox", { name: "筛选操作结果" }).click();
  await page.getByRole("option", { name: "失败", exact: true }).click();
  await expect(page.getByText("没有匹配的审计记录")).toBeVisible();
});
