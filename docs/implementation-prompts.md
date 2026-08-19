# UI 与基础设施实施提示词

这些提示词把 [`product-blueprint.md`](./product-blueprint.md) 拆成可验证的小批次。每次只执行一个阶段；不要一次提交整套重构。

所有阶段的共同前置提示：

```text
你正在修改 Next Fullstack Starter。先完整阅读根目录 AGENTS.md、DESIGN.md、
docs/product-blueprint.md，以及本任务涉及的本地技能。任何 Next.js 修改都先阅读
node_modules/next/dist/docs 中对应的 Next.js 16 文档。

必须保留：Server Component 直接查询 DAL、Server Action 只做 mutation、Zod 校验、
靠近数据源的会话/权限检查、项目所有权进入 mutation 查询、窄 DTO、pnpm、Biome 规范。
不得修改 src/components/ui/ 或 src/components/calendar/。

视觉目标是“Notion 启发的中文个人工具”，不是像素复刻，也不是营销落地页。
业务优先、设置收纳、柔和画布、安静边框、内容优先、一个结构强调色。
```

## Prompt 0：建立可回归基线

```text
只做审计和测试基线，不改变视觉。

1. 列出现有 dashboard、profile、users、roles、projects 路由和权限行为。
2. 为目标设置路由与旧路由重定向制定测试矩阵。
3. 记录桌面 1440px 和移动 390px 的关键页面截图或结构快照。
4. 标记所有把 Card 当默认页面容器、所有在主导航暴露设置项的位置。
5. 输出最小改动顺序和风险；不要实现下一阶段。

验证：pnpm typecheck、pnpm check、pnpm test:unit、现有 pnpm test:e2e。
```

## Prompt 1：重构应用壳层和导航

```text
实现 docs/product-blueprint.md 的 Phase 1，只改应用壳层和路由骨架。

目标：
- 主侧栏只保留首页、项目等业务项。
- 左下角用户行打开 DropdownMenu；只提供设置总入口和退出登录。
- 建立 /dashboard/settings layout、设置分组导航和空的目标页面骨架。
- /dashboard/profile、/dashboard/users、/dashboard/roles 服务端重定向到新地址。
- 顶栏显示当前页面上下文，不再固定显示“本地工作台”；右上角提供浅色/深色快捷切换。
- 移动使用现有 Sidebar/Sheet 能力，用户入口位于移动导航底部。

约束：
- 导航配置有类型，图标传组件对象，不用字符串映射。
- UI 可见性不是授权；新设置页面保留 requireUser/requireAdmin。
- DropdownMenuItem 放入 DropdownMenuGroup，Avatar 始终包含 AvatarFallback。
- 不改业务页面内容和全局主题 token。

验收：普通用户与管理员看到不同的设置分区；旧链接可用；键盘可完成全部导航。
```

## Prompt 2：迁移设置中心

```text
实现设置内容，不做首页和项目页视觉重构。

目标：
- /settings/profile：姓名与只读邮箱。
- /settings/security：修改密码；若现有 Better Auth 能力已支持且无需扩大范围，再展示会话列表。
- /settings/appearance：把现有 preference registry 中适合用户理解的主题、字体、内容宽度、侧栏选项做成 UI。
- /settings/users 与 /settings/roles：迁移现有管理员页面。
- /settings/data：先提供数据位置、备份命令和恢复文档入口；不要实现会覆盖数据库的 UI。
- /settings/about：版本、运行模式、窄化后的健康状态。

组件规则：
- 表单使用 FieldGroup + Field；设置项优先 horizontal Field。
- 2–5 个互斥视觉选项使用 ToggleGroup；长选项使用 RadioGroup/Select。
- 用 Separator 分章节，不给每个设置项套 Card。
- 异步按钮使用 Spinner + disabled；错误使用 data-invalid + aria-invalid。

验收：刷新后外观偏好保持；普通用户无法渲染或直接访问管理员页；敏感路径和 token 不出现在 UI。
```

## Prompt 3：建立 Notion 启发的应用视觉系统

```text
依据 DESIGN.md 和 product-blueprint.md 改造语义 token 与应用级共享组件。

目标：
- 暖灰画布、白色内容表面、暖黑文字、单一蓝色结构强调。
- 中文正文优先可读的无衬线字体；应用页面标题控制在 24–28px。
- 默认层级使用 hairline 和表面差，阴影只给弹层。
- 导航/输入 6px 左右圆角，内容容器 8–12px。
- 建立 Overview、Collection、Document、Settings 四种 page shell 宽度。
- light/dark 两套 token 都保持清晰层级与可读对比。

约束：
- 只在 src/app/globals.css 改全局 token。
- 业务组件只使用语义颜色，不散落原始颜色或手写 dark: 色值。
- 不套用 DESIGN.md 的 64px 营销标题、全胶囊按钮或装饰贴纸。
- 不修改 shadcn 原语文件。

验收：页面层级不依赖大量 Card；focus-visible 清楚；prefers-reduced-motion 有效。
```

## Prompt 4：重构业务页面模式

```text
重构首页、项目页、登录页和状态页，套用新的 page shell。

首页：
- 只显示业务信息：最近项目、空状态、必要统计和一个主动作。
- 删除“模板已就绪”、技术栈和长期管理员说明。
- 没有项目时以 Empty 作为主内容，不渲染空卡片墙。

项目页：
- 使用 Collection 模板：标题、搜索/过滤、唯一主动作、列表/表格、空状态。
- 行级操作进入上下文菜单；归档状态用 Badge。

登录与状态页：
- 使用相同语义 token、字体和表面层级。
- 404、unauthorized、error 都给出明确恢复动作。

验收：1440px 不出现无意义拉伸；390px 不只是桌面卡片机械堆叠；首屏主动作唯一。
```

## Prompt 5：基础设施补强

```text
按 product-blueprint.md 的基础设施表逐项实现，优先安全与可恢复性。

第一批只包含：
1. 服务端结构化日志与敏感字段脱敏。
2. 登录和高成本 mutation 的单实例限流，并清楚记录部署边界。
3. 适配当前 Next.js 16 的安全响应头和 CSP。
4. 登录、会话撤销、用户状态变更等最小审计事件模型，并提供管理员分页查看。
5. 完整数据保护使用 SQLite 备份与恢复；通用模板不预设业务导入/导出格式。
6. 恢复操作继续保留在停机 CLI/文档流程，不从运行中 UI 覆盖 SQLite。

不要顺带加入 OAuth、邮件、多租户、计费、队列、云分析或 PWA 同步。

验收：增加针对越权、限流、日志脱敏、导入坏数据和回滚的测试；更新 README 运维步骤。
```

## Prompt 6：模板化收尾

```text
把项目整理成“内核 + 可删除示例业务”。

目标：
- 文档标明删除 projects 示例模块所需的文件、路由、schema 和迁移步骤。
- 设置、认证、应用壳层、错误处理、偏好和运维能力不依赖 projects。
- 提供新项目启动检查表：改名、图标、业务导航、schema、权限、备份、测试、发布。
- 提供可选能力决策表，不默认安装新依赖。
- 确保数据库默认仍为空，不加入演示账号或业务数据。

最终验证：pnpm build、pnpm typecheck、pnpm check、pnpm test:unit、pnpm test:e2e。
```
