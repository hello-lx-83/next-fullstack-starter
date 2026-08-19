export function getSafeDashboardPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "/dashboard" || candidate?.startsWith("/dashboard/") ? candidate : "/dashboard";
}
