import { expect, test } from "./fixtures";

test("项目页硬刷新后无水合错误，新建弹框可重复打开", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|didn't match|server rendered/i.test(message.text())) {
      errors.push(message.text());
    }
  });

  await page.goto("/login");
  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码", { exact: true }).fill("AdminPass123!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/projects");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.reload();
    await page.getByRole("button", { name: "新建项目", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "新建项目", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "新建项目", exact: true }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }

  expect(errors).toEqual([]);
});
