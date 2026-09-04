"use client";
import { useId } from "react";

import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { fontOptions } from "@/lib/fonts/registry";
import { TEXT_SIZE_OPTIONS, THEME_COLOR_OPTIONS } from "@/lib/preferences/theme";
import { THEME_SWATCHES } from "@/lib/preferences/theme-swatches";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { AppearanceChoice, AppearanceSelect } from "./appearance-controls";

const THEME_MODES = [
  { icon: <Sun data-icon="inline-start" />, label: "浅色", value: "light" },
  { icon: <Moon data-icon="inline-start" />, label: "深色", value: "dark" },
  { icon: <Monitor data-icon="inline-start" />, label: "跟随系统", value: "system" },
] as const;
const CONTENT_LAYOUTS = [
  { label: "居中", value: "centered" },
  { label: "全宽", value: "full-width" },
] as const;
const NAVBAR_STYLES = [
  { label: "固定顶部", value: "sticky" },
  { label: "随页面滚动", value: "scroll" },
] as const;
const SIDEBAR_VARIANTS = [
  { label: "标准", value: "sidebar" },
  { label: "嵌入", value: "inset" },
  { label: "悬浮", value: "floating" },
] as const;
const SIDEBAR_COLLAPSIBLE_OPTIONS = [
  { label: "收起为图标", value: "icon" },
  { label: "完全隐藏", value: "offcanvas" },
] as const;

export function AppearanceSettings() {
  const { setPreference, resetPreferences, values, resolvedThemeMode } = usePreferencesStore(
    useShallow((state) => ({
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
      values: state.values,
      resolvedThemeMode: state.resolvedThemeMode,
    })),
  );
  const sectionId = useId();
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4" aria-labelledby={`${sectionId}-theme`}>
        <h3 id={`${sectionId}-theme`} className="font-medium">
          主题与字体
        </h3>
        <Separator />
        <FieldGroup className="gap-3">
          <AppearanceChoice
            label="显示模式"
            value={values.theme_mode}
            options={THEME_MODES}
            onChange={(value) => setPreference("theme_mode", value)}
          />
          <AppearanceSelect
            label="主题色"
            value={values.theme_color}
            options={THEME_COLOR_OPTIONS.map((option) => ({
              ...option,
              color: THEME_SWATCHES[option.value][resolvedThemeMode],
            }))}
            onChange={(value) => setPreference("theme_color", value)}
          />
          <AppearanceSelect
            label="界面字体"
            value={values.font}
            options={fontOptions}
            onChange={(value) => setPreference("font", value)}
          />
          <AppearanceChoice
            label="文字大小"
            value={values.text_size}
            options={TEXT_SIZE_OPTIONS}
            onChange={(value) => setPreference("text_size", value)}
          />
        </FieldGroup>
      </section>
      <section className="flex flex-col gap-4" aria-labelledby={`${sectionId}-layout`}>
        <h3 id={`${sectionId}-layout`} className="font-medium">
          布局与导航
        </h3>
        <Separator />
        <FieldGroup className="gap-3">
          <AppearanceChoice
            label="内容宽度"
            value={values.content_layout}
            options={CONTENT_LAYOUTS}
            onChange={(value) => setPreference("content_layout", value)}
          />
          <AppearanceChoice
            label="顶部栏"
            value={values.navbar_style}
            options={NAVBAR_STYLES}
            onChange={(value) => setPreference("navbar_style", value)}
          />
          <AppearanceChoice
            label="侧栏样式"
            value={values.sidebar_variant}
            options={SIDEBAR_VARIANTS}
            onChange={(value) => setPreference("sidebar_variant", value)}
          />
          <AppearanceChoice
            label="侧栏收起方式"
            value={values.sidebar_collapsible}
            options={SIDEBAR_COLLAPSIBLE_OPTIONS}
            onChange={(value) => setPreference("sidebar_collapsible", value)}
          />
        </FieldGroup>
      </section>

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetPreferences();
            toast.add({ type: "success", title: "已恢复默认外观" });
          }}
        >
          <RotateCcw data-icon="inline-start" />
          恢复默认外观
        </Button>
      </div>
    </div>
  );
}
