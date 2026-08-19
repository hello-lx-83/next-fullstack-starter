import { eq, ne } from "drizzle-orm";

import type { db } from "@/server/db";
import { user } from "@/server/db/schema";

export function enforceSingleAdmin(database: typeof db, admin: { id: string; name: string }) {
  database.transaction((tx) => {
    const target = tx.select({ id: user.id }).from(user).where(eq(user.id, admin.id)).get();
    if (!target) throw new Error("超级管理员账号不存在");

    tx.update(user).set({ role: "user" }).where(ne(user.id, admin.id)).run();
    tx.update(user)
      .set({
        name: admin.name,
        role: "admin",
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, admin.id))
      .run();
  });
}
