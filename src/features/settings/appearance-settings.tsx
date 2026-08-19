"use client";

import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fontOptions } from "@/lib/fonts/registry";
import type { PreferenceValueMap } from "@/lib/preferences/preferences-config";
import { THEME_PRESET_OPTIONS } from "@/lib/preferences/theme";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

const THEME_MODES = [
  { icon: Sun, label: "浅色", value: "light" },
  { icon: Moon, label: "深色", value: "dark" },
  { icon: Monitor, label: "跟随系统", value: "system" },
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
  const { resetPreferences, setPreference, values } = usePreferencesStore(
    useShallow((state) => ({
      resetPreferences: state.resetPreferences,
      setPreference: state.setPreference,
      values: state.values,
    })),
  );

  function resetAppearance() {
    resetPreferences();
    toast.success("已恢复默认外观");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5" aria-labelledby="appearance-color-title">
        <div className="flex flex-col gap-1">
          <h3 id="appearance-color-title" className="font-medium">
            颜色与字体
          </h3>
          <p className="text-muted-foreground text-sm">选择适合当前工具和使用环境的视觉组合。</p>
        </div>
        <Separator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="theme-mode-label">显示模式</FieldTitle>
              <FieldDescription>顶部按钮可快速切换浅色与深色，这里还可选择跟随系统。</FieldDescription>
            </FieldContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.theme_mode}
              onValueChange={(value) => {
                if (value) setPreference("theme_mode", value as PreferenceValueMap["theme_mode"]);
              }}
              aria-labelledby="theme-mode-label"
              className="flex-wrap justify-start"
            >
              {THEME_MODES.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
                  <option.icon data-icon="inline-start" />
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="theme-preset-label">配色方案</FieldTitle>
              <FieldDescription>改变强调色、边框和组件的整体视觉性格。</FieldDescription>
            </FieldContent>
            <Select
              value={values.theme_preset}
              onValueChange={(value) => setPreference("theme_preset", value as PreferenceValueMap["theme_preset"])}
            >
              <SelectTrigger aria-labelledby="theme-preset-label" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="font-label">界面字体</FieldTitle>
              <FieldDescription>个人工具默认推荐清晰、安静的无衬线字体。</FieldDescription>
            </FieldContent>
            <Select
              value={values.font}
              onValueChange={(value) => setPreference("font", value as PreferenceValueMap["font"])}
            >
              <SelectTrigger aria-labelledby="font-label" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="appearance-layout-title">
        <div className="flex flex-col gap-1">
          <h3 id="appearance-layout-title" className="font-medium">
            布局与导航
          </h3>
          <p className="text-muted-foreground text-sm">这些设置会即时应用，并在刷新后保持。</p>
        </div>
        <Separator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="content-layout-label">内容宽度</FieldTitle>
              <FieldDescription>居中适合阅读与表单，全宽适合表格和密集工具。</FieldDescription>
            </FieldContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.content_layout}
              onValueChange={(value) => {
                if (value) setPreference("content_layout", value as PreferenceValueMap["content_layout"]);
              }}
              aria-labelledby="content-layout-label"
            >
              {CONTENT_LAYOUTS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="navbar-style-label">顶部栏</FieldTitle>
              <FieldDescription>固定顶部方便频繁切换页面，随页面滚动则更专注内容。</FieldDescription>
            </FieldContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.navbar_style}
              onValueChange={(value) => {
                if (value) setPreference("navbar_style", value as PreferenceValueMap["navbar_style"]);
              }}
              aria-labelledby="navbar-style-label"
              className="flex-wrap justify-start"
            >
              {NAVBAR_STYLES.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="sidebar-variant-label">侧栏样式</FieldTitle>
              <FieldDescription>选择侧栏与内容区域之间的空间关系。</FieldDescription>
            </FieldContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.sidebar_variant}
              onValueChange={(value) => {
                if (value) setPreference("sidebar_variant", value as PreferenceValueMap["sidebar_variant"]);
              }}
              aria-labelledby="sidebar-variant-label"
              className="flex-wrap justify-start"
            >
              {SIDEBAR_VARIANTS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle id="sidebar-collapsible-label">侧栏收起方式</FieldTitle>
              <FieldDescription>保留图标便于切换，或完全隐藏以获得更大空间。</FieldDescription>
            </FieldContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.sidebar_collapsible}
              onValueChange={(value) => {
                if (value) setPreference("sidebar_collapsible", value as PreferenceValueMap["sidebar_collapsible"]);
              }}
              aria-labelledby="sidebar-collapsible-label"
              className="flex-wrap justify-start"
            >
              {SIDEBAR_COLLAPSIBLE_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldGroup>
      </section>

      <div>
        <Button type="button" variant="outline" onClick={resetAppearance}>
          <RotateCcw data-icon="inline-start" />
          恢复默认外观
        </Button>
      </div>
    </div>
  );
}
