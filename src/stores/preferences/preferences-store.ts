import { createStore } from "zustand/vanilla";

import { applyPreference } from "@/lib/preferences/preference-runtime";
import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_KEYS,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "@/lib/preferences/preferences-config";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import type { ResolvedThemeMode } from "@/lib/preferences/theme";

export type PreferencesState = {
  values: PreferenceValueMap;
  resolvedThemeMode: ResolvedThemeMode;
  isSynced: boolean;
  setPreference: <K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]) => void;
  setPreferences: (values: Partial<PreferenceValueMap>) => void;
  resetPreferences: () => void;
};

export const createPreferencesStore = (initialValues: Partial<PreferenceValueMap> = {}) => {
  const values: PreferenceValueMap = {
    ...PREFERENCE_DEFAULTS,
    ...initialValues,
  };

  return createStore<PreferencesState>()((set, get) => ({
    values,
    resolvedThemeMode: values.theme_mode === "dark" ? "dark" : "light",
    isSynced: false,

    setPreference: (key, value) => get().setPreferences({ [key]: value }),

    setPreferences: (patch) => {
      const next = { ...get().values };
      let resolvedThemeMode = get().resolvedThemeMode;
      function update<K extends PreferenceKey>(key: K) {
        if (patch[key] === undefined) return;
        const value = parsePreference(key, patch[key]);
        next[key] = value;
        const resolved = applyPreference(key, value);
        if (resolved) resolvedThemeMode = resolved;
        void persistPreference(key, value);
      }
      for (const key of PREFERENCE_KEYS) update(key);
      set({ values: next, resolvedThemeMode });
    },

    resetPreferences: () => get().setPreferences(PREFERENCE_DEFAULTS),
  }));
};
