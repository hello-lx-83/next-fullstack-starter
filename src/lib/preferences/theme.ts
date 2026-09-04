export const THEME_MODE_VALUES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

export const THEME_COLOR_OPTIONS = [
  { value: "neutral", label: "默认" },
  { value: "blue", label: "蓝" },
  { value: "green", label: "绿" },
  { value: "orange", label: "橙" },
  { value: "violet", label: "紫" },
  { value: "rose", label: "玫红" },
] as const;
export const TEXT_SIZE_OPTIONS = [
  { value: "small", label: "小" },
  { value: "default", label: "标准" },
  { value: "large", label: "大" },
] as const;
