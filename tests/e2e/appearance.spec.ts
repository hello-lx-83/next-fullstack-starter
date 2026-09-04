import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./fixtures";

test("基础外观配置即时生效、刷新保持且保留布局设置", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "打开账户菜单" }).click();
  await page.getByRole("menuitem", { name: "设置", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "设置", exact: true });
  await dialog.getByRole("link", { name: "外观", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "自定义主题", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "全宽", exact: true }).click();
  await dialog.getByRole("button", { name: "随页面滚动", exact: true }).click();
  await dialog.getByRole("button", { name: "悬浮", exact: true }).click();
  await dialog.getByRole("button", { name: "完全隐藏", exact: true }).click();
  async function select(label: string, option: string) {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page
      .locator('[data-slot="select-content"][data-open]')
      .getByRole("option", { name: option, exact: true })
      .click();
  }
  await select("主题色", "蓝");
  await select("界面字体", "系统衬线");
  expect(
    await dialog.getByRole("heading", { name: "外观", exact: true }).evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Songti");
  expect(
    await dialog
      .getByText("调整主题、字体与界面布局。", { exact: true })
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Songti");
  const sizes = dialog.getByRole("group", { name: "文字大小", exact: true });
  await sizes.getByRole("button", { name: "大", exact: true }).click();
  await expect(dialog.getByRole("combobox", { name: "界面字体", exact: true })).toHaveCSS("font-size", "16px");
  await expect(page.locator("html")).toHaveCSS("font-size", "16px");
  await expect(dialog.getByRole("heading", { name: "外观", exact: true })).toHaveCSS("font-size", "22px");
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await dialog.getByRole("button", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual([]);
  await page.reload();
  for (const [name, value] of Object.entries({
    "theme-color": "blue",
    font: "systemSerif",
    "text-size": "large",
    "content-layout": "full-width",
    "navbar-style": "scroll",
    "sidebar-variant": "floating",
    "sidebar-collapsible": "offcanvas",
  })) {
    await expect(page.locator("html")).toHaveAttribute(`data-${name}`, value);
  }
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "跟随系统", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "浅色", exact: true }).click();
  await page.goto("/dashboard/projects");
  await page.goto("/dashboard/users");
  await expect(page.getByRole("table", { name: "用户列表" })).toHaveCSS("font-size", "16px");
  await page.goto("/dashboard/projects");
  await page.getByRole("button", { name: "新建项目", exact: true }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("名称", { exact: true }).fill("大字号检查");
  expect(await form.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.goto("/dashboard/settings/appearance");
  await page
    .getByRole("group", { name: "文字大小", exact: true })
    .getByRole("button", { name: "小", exact: true })
    .click();
  await expect(page.getByRole("combobox", { name: "界面字体", exact: true })).toHaveCSS("font-size", "13px");
  await page.getByRole("button", { name: "恢复默认外观", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "界面字体", exact: true })).toHaveCSS("font-size", "14px");
  await expect(page.locator("html")).toHaveAttribute("data-theme-color", "neutral");
  await expect(page.locator("html")).toHaveAttribute("data-font", "geist");
  await expect(page.locator("html")).toHaveAttribute("data-content-layout", "centered");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("appearance-desktop.png"), fullPage: true });
  expect(errors).toEqual([]);
});
