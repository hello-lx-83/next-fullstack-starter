import { beforeEach, describe, expect, it, vi } from "vitest";

import { PREFERENCE_DEFAULTS, PREFERENCE_KEYS, parsePreference } from "@/lib/preferences/preferences-config";
import { createPreferencesStore } from "@/stores/preferences/preferences-store";

const { applied, persisted } = vi.hoisted(() => ({
  applied: vi.fn(),
  persisted: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/preferences/preference-runtime", () => ({ applyPreference: applied }));
vi.mock("@/lib/preferences/preferences-storage", () => ({ persistPreference: persisted }));
beforeEach(() => vi.clearAllMocks());

describe("appearance preferences", () => {
  it("changing theme, font and size preserves all layout choices", () => {
    const layout = {
      content_layout: "full-width",
      navbar_style: "scroll",
      sidebar_variant: "floating",
      sidebar_collapsible: "offcanvas",
    } as const;
    const store = createPreferencesStore({ ...layout, theme_mode: "dark" });
    store.getState().setPreference("theme_color", "blue");
    store.getState().setPreference("font", "systemSerif");
    store.getState().setPreference("text_size", "large");
    expect(store.getState().values).toMatchObject({
      ...layout,
      theme_mode: "dark",
      theme_color: "blue",
      font: "systemSerif",
      text_size: "large",
    });
    expect(persisted).toHaveBeenCalledWith("text_size", "large");
    expect(parsePreference("text_size", "unsupported")).toBe("default");
  });
  it("reset restores all defaults in the DOM and storage", () => {
    const store = createPreferencesStore({
      theme_mode: "dark",
      theme_color: "rose",
      font: "system",
      text_size: "large",
      sidebar_collapsible: "offcanvas",
    });
    store.getState().resetPreferences();
    expect(store.getState().values).toEqual(PREFERENCE_DEFAULTS);
    for (const key of PREFERENCE_KEYS) {
      expect(applied).toHaveBeenCalledWith(key, PREFERENCE_DEFAULTS[key]);
      expect(persisted).toHaveBeenCalledWith(key, PREFERENCE_DEFAULTS[key]);
    }
  });
});
