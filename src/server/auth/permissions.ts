export type AppRole = "admin" | "user";

export function isAdmin(role: string | null | undefined): boolean {
  return role?.split(",").includes("admin") ?? false;
}

export function canManageProject(role: string | null | undefined, userId: string, ownerId: string): boolean {
  return isAdmin(role) || userId === ownerId;
}
