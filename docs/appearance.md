# 外观配置

模板固定使用 shadcn/ui 的 Base UI / Nova、Neutral 基础灰阶与 Lucide。外观面板只提供四项常用配置：显示模式、主题色、界面字体、文字大小；选择后即时生效并保存于浏览器 Cookie。

- 显示模式：浅色、深色、跟随系统。
- 主题色：默认、蓝、绿、橙、紫、玫红。
- 界面字体：系统默认、Geist Sans、系统衬线、Geist Mono。标题和正文使用同一字体，包含中文回退。
- 文字大小：小、标准、大。通过文字 token 调整字号，保留布局宽度和间距。

原有布局与导航配置保持独立：内容宽度、顶部栏、侧栏样式、侧栏收起方式。恢复默认外观延续原有行为，恢复全部外观及布局默认值。

## 模板配置入口

- `src/lib/preferences/preferences-config.ts`：允许值、默认值、持久化方式与 HTML 属性。
- `src/lib/preferences/theme.ts`：主题色和字号选项；`theme-swatches.ts` 提供色点样本。
- `src/app/globals.css`：固定基础 token、浅深色主题色与文字大小。颜色来自 [shadcn 官方主题数据](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/themes.ts)。圆角、菜单和图表采用模板统一默认样式。
- `src/lib/fonts/registry.ts`：客户端字体元数据；`loaded.ts` 由根布局加载包内 Geist 资源。系统字体不需要下载。
- `src/features/settings/appearance-settings.tsx`：复用现有 Base UI 控件组成面板，无自定义主题编辑器或独立预览。

启动脚本在 hydration 前读取偏好，刷新后保持颜色、字体及字号。新增配置需同时验证桌面和移动端，尤其是较大字号下的表格、表单与弹框。
