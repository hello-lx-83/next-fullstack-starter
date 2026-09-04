# 工程验证与环境约定

## 运行环境

项目以 Node.js 22 为默认验证版本，`.node-version` 与 CI 共用版本声明。pnpm 版本来自 `package.json#packageManager`，CI 不再重复维护。

安装依赖使用 `pnpm install`；CI 使用 `pnpm install --frozen-lockfile`，避免隐式修改锁文件。

## 配置与初始化

`pnpm env:check` 只校验服务端配置，不连接数据库，也不打印密钥。管理员字段由 `auth:bootstrap` 校验。

迁移、管理员初始化和备份统一通过 `@next/env` 加载配置。命令行默认按开发环境加载；生产维护命令应显式设置 `NODE_ENV=production`。

优先级与 Next.js 一致：

1. 已注入的进程环境变量。
2. `.env.<环境>.local`。
3. `.env.local`（测试环境忽略）。
4. `.env.<环境>`。
5. `.env`。

例如，PowerShell 中执行生产迁移：

```powershell
$env:NODE_ENV = "production"
pnpm env:check
pnpm db:backup
pnpm db:migrate
```

数据库文件路径可使用 `./data/app.db` 或 `file:./data/app.db`。迁移拒绝内存数据库；应用和测试仍可使用内存数据库。备份、迁移和应用应使用同一组环境配置。

`pnpm setup` 依次执行环境检查、迁移和管理员初始化。它不生成演示数据，也不会覆盖已有管理员密码。

## 本地验证

```bash
pnpm check
pnpm typecheck
pnpm test:unit
pnpm test:e2e
```

- 单元测试的默认连接使用内存数据库。需要验证文件行为的测试在系统临时目录中创建独立文件，并在结束后清理。
- 回归测试包含环境加载优先级、全量迁移的空库初始化与重复执行，以及保留 WAL 提交数据的备份和单文件恢复。
- E2E 每次生成 UUID，使用 `data/e2e/<UUID>/test.db`，与应用数据库隔离。
- E2E 启动器自动初始化数据库、构建生产版本、启动 3100 端口，并等待就绪探针。因此直接执行 `pnpm exec playwright test` 也支持初始化。
- 所有 E2E 用例使用 `tests/e2e/fixtures.ts` 导出的 `test` 和 `expect`；自动 fixture 在每个用例开始前清空测试库限流记录，避免登录额度跨用例累积，用例内部仍保留真实限流规则。
- E2E 的数据库和 PID 路径由运行标识传递给子进程；退出时清理服务器 PID 文件。数据库保留用于本地诊断，需要时可在测试进程退出后清理对应运行目录。
- 不要在同一工作目录并发执行两次 E2E：数据库虽然独立，3100 端口和生产构建目录仍共用。
- 测试数据只在测试环境创建。数据库、环境文件和测试产物不提交到 Git。

本地缺少 Playwright Chromium 时先执行 `pnpm test:e2e:install`；受限网络中可按 README 选择系统 Chrome 或 Edge。

## CI 门禁

PR、main 分支推送和手动触发均执行：

- `quality`：在 Ubuntu 和 Windows 上安装锁定依赖，执行环境检查、Biome、类型检查、单测、空库迁移和生产构建。
- `e2e`：在 Ubuntu 上安装 Chromium，执行桌面、移动端及可访问性等现有 E2E 测试。
- CI 禁止遗留 `test.only`；不自动重试，以免共享业务状态影响诊断。
- Playwright 生成 HTML 报告，失败用例保留截图与 trace。未取消的任务上传 `playwright-report/` 和 `test-results/`，保留 7 天；不上传数据库。

仓库维护者需在 GitHub 分支保护或 ruleset 中将两个 `quality` 矩阵检查及 `e2e` 设为合并必需检查。提交 workflow 文件不会自动启用分支保护。

## 依赖更新

Dependabot 每周为包依赖与 GitHub Actions 创建更新 PR，Next.js 与 `@next/*` 归为一组。更新通过相同 CI 验证，再由维护者审核合并；不自动合并。

## 后续运行保障

上线前按 [生产运行手册](./production-runbook.md) 验证持久化目录、反向代理、备份存储与恢复流程。自动化备份调度、异地副本和告警需要结合实际部署环境配置，本模板不默认绑定云服务。
