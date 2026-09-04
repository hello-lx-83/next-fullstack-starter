// Font metadata is safe to import from client components and preference validation.
export const fontOptions = [
  { value: "system", label: "系统默认" },
  { value: "geist", label: "Geist Sans" },
  { value: "systemSerif", label: "系统衬线" },
  { value: "geistMono", label: "Geist Mono" },
] as const;
export type FontKey = (typeof fontOptions)[number]["value"];
export const fontKeys = fontOptions.map((option) => option.value);
