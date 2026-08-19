# Next Fullstack Starter

一个面向本地小工具和内部管理平台的 Next.js 16 全栈项目模板。项目默认使用简体中文，数据保存在本地 SQLite 文件中，不依赖 Docker、云数据库、邮件或 OAuth 服务。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui
- SQLite、Drizzle ORM、Drizzle Kit
- Better Auth 邮箱密码认证与 `admin/user` RBAC
- 持久化认证限流、最小审计事件、结构化服务端日志与安全响应头
- Zod、React Server Components、Server Actions
- Biome、Vitest、Playwright、pnpm

## 本地启动

要求 Node.js 22 或更高版本，以及 pnpm 10.20.0。

```bash
pnpm install
cp .env.example .env
```

编辑 `.env`，至少替换 `BETTER_AUTH_SECRET` 和 `ADMIN_PASSWORD`。随后初始化数据库和首个管理员：

```bash
pnpm run setup
pnpm dev
```

访问 [http://localhost:3009](http://localhost:3009)，使用 `.env` 中的管理员邮箱和密码登录。

`pnpm auth:bootstrap` 是幂等命令：账号已存在时只确保姓名、管理员角色和启用状态正确，不会创建演示数据。

## 架构

```text
src/
├─ app/                   # 路由、布局和 Route Handlers
├─ features/              # 按业务领域组织的组件、Schema 和 Actions
├─ server/
│  ├─ auth/               # Better Auth、会话与权限
│  ├─ db/                 # Drizzle schema 与 SQLite 连接
│  └─ dal/                # 受鉴权保护的数据访问层
├─ components/
│  ├─ ui/                 # shadcn/ui 基础组件
│  └─ shared/             # 应用级共享组件
├─ config/                # 应用与环境配置
└─ lib/                   # 通用类型和工具
drizzle/                  # 可提交的数据库迁移
scripts/                  # 本地初始化脚本
tests/                    # 单元和端到端测试
data/                     # 本地 SQLite 文件，不提交到 Git
```

Server Components 直接调用 DAL 查询数据；写操作使用 Server Actions。`proxy.ts` 只负责基于会话 Cookie 的快速跳转，真正的身份与权限检查在 DAL、页面和每个 Action 中完成。

## 产品与界面设计

- [`DESIGN.md`](./DESIGN.md)：下载并纳入项目管理的 Notion 视觉语言参考。
- [`docs/product-blueprint.md`](./docs/product-blueprint.md)：面向个人工具的产品定位、信息架构、设置中心、视觉系统与基础设施取舍。
- [`docs/implementation-prompts.md`](./docs/implementation-prompts.md)：按阶段执行改造的提示词与验收条件。
- [`docs/new-project-checklist.md`](./docs/new-project-checklist.md)：从 GitHub Template 创建新项目后的改名、配置、裁剪和验收清单。

`DESIGN.md` 分析的主要是 Notion 营销站，项目不会直接照搬大号展示标题或营销组件；实际应用以产品蓝图中的中文工具界面规范为准。

## 默认权限

- 普通用户：管理自己创建的项目，修改自己的姓名和密码，并撤销自己的其他登录会话。
- 唯一超级管理员：管理所有项目，创建、停用或删除普通用户，并可重置普通用户密码。
- 超级管理员由 `pnpm auth:bootstrap` 维护，界面和认证接口均不能创建第二个管理员或调整角色。
- 角色和权限在代码中定义，不支持运行时新增角色。
- 公开注册默认关闭；管理员创建账号并设置初始密码。

## 常用命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建
pnpm typecheck        # TypeScript 检查
pnpm check            # Biome 检查
pnpm format           # 格式化代码
pnpm db:generate      # 根据 schema 生成迁移
pnpm db:migrate       # 应用迁移
pnpm db:backup        # 校验并备份当前 SQLite 数据库
pnpm db:studio        # 打开 Drizzle Studio
pnpm auth:bootstrap   # 初始化/校准管理员
pnpm test:unit        # Vitest
pnpm test:e2e         # Playwright
pnpm test             # 全部测试
```

修改数据库 schema 后，先运行 `pnpm db:generate` 检查生成的 SQL，再运行 `pnpm db:migrate`。数据库文件及 WAL/SHM 文件已加入 `.gitignore`。

## SQLite 备份与恢复

应用以单进程方式使用本地 SQLite，不要让多个应用实例同时写入同一个数据库文件。连接默认启用外键、WAL、5 秒锁等待和 `NORMAL` 同步模式。

升级模板、执行迁移或进行重要数据操作前，先运行：

```bash
pnpm db:backup
```

命令会先执行 `PRAGMA quick_check`，再使用 SQLite 在线备份 API 将副本写入数据库同级的 `backups/` 目录，并再次校验备份。恢复时先停止应用，将当前数据库文件移走，再把选定的备份复制为 `.env` 中 `DATABASE_URL` 指定的文件名。

升级应用或应用新的数据库迁移时，按以下顺序执行：

```bash
pnpm db:backup
pnpm db:migrate
pnpm build
```

迁移失败时不要继续启动新版本。停止应用，保留失败现场，再按上面的恢复流程还原最近一次已校验的备份。

## 安全、限流与审计

- 所有动态请求由 `proxy.ts` 生成新的 `x-request-id`，服务端日志和审计事件使用它关联同一次请求。
- Next.js 为所有响应设置 CSP、禁止嵌入、内容类型嗅探限制、Referrer Policy 和 Permissions Policy。
- Better Auth 的限流在开发和生产环境均显式启用，状态保存在 SQLite 的 `rate_limit` 表中；登录和修改密码默认为每分钟最多 5 次。
- 登录成功、会话撤销、用户创建/停用/删除、密码修改/重置和永久删除项目会写入 `audit_event`。管理员可在“设置 → 管理 → 审计日志”查看只读记录；列表采用服务端分页，每页 20 条。审计表不保存密码、Cookie、token 或表单内容。
- 服务端日志为一行一个 JSON 对象；`authorization`、`cookie`、`password`、`secret`、`token` 等字段会递归脱敏。

运行日志面向终端、服务管理器或日志平台，不在应用设置中提供原文查看界面。通用模板不提供业务 JSON 导入/导出；完整数据保护使用 SQLite 备份与恢复流程，具体业务确有交换需求时再设计专用格式。

模板不会默认信任 `X-Forwarded-For`。部署到反向代理之后，应只按实际代理地址配置 Better Auth 的可信代理和 IP 请求头；不要接受客户端可直接伪造的转发链。

当前 CSP 为兼容 Next.js 静态渲染使用 `unsafe-inline`。如项目具有更严格的合规要求，可以改为 nonce CSP，但这会让相关页面进入动态渲染，需重新评估缓存与性能。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | SQLite 文件路径，默认 `./data/app.db` |
| `BETTER_AUTH_URL` | 应用基础地址，本地默认 `http://localhost:3009` |
| `BETTER_AUTH_SECRET` | 至少 32 位的会话密钥 |
| `ADMIN_NAME` | 初始化管理员姓名 |
| `ADMIN_EMAIL` | 初始化管理员邮箱 |
| `ADMIN_PASSWORD` | 初始化管理员密码，至少 8 位 |

本模板不提交 `.env`、账号、项目或其他示例记录。
