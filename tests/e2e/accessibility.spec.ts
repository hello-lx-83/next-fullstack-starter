import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((violation) => ({
    description: violation.description,
    help: violation.help,
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target),
  }));

  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test("登录页通过自动化无障碍检查", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("核心工作台页面通过自动化无障碍检查", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("AdminPass123!");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  for (const path of ["/dashboard", "/dashboard/projects", "/dashboard/settings/data"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    await expectNoAccessibilityViolations(page);
  }
});
