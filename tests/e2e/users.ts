import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function createUserThroughUi(page: Page, input: { name: string; email: string; password: string }) {
  await page.goto("/dashboard/users");
  await page.getByRole("button", { name: "创建用户", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "创建本地用户" });
  await dialog.getByLabel("姓名", { exact: true }).fill(input.name);
  await dialog.getByLabel("邮箱", { exact: true }).fill(input.email);
  await dialog.getByLabel("初始密码", { exact: true }).fill(input.password);
  await dialog.getByRole("button", { name: "创建", exact: true }).click();
  await expect(dialog).toBeHidden();
}
