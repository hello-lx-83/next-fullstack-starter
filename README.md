# Next Fullstack Starter

一个面向本地小工具和内部管理平台的 Next.js 16 全栈项目模板。项目默认使用简体中文，数据保存在本地 SQLite 文件中，不依赖 Docker、云数据库、邮件或 OAuth 服务。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui
- SQLite、Drizzle ORM、Drizzle Kit
- Better Auth 邮箱密码认证与 `admin/user` RBAC
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

`DESIGN.md` 分析的主要是 Notion 营销站，项目不会直接照搬大号展示标题或营销组件；实际应用以产品蓝图中的中文工具界面规范为准。

## 默认权限

- 普通用户：管理自己创建的项目，修改自己的姓名和密码。
- 唯一超级管理员：管理所有项目，并创建或停用普通用户。
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
