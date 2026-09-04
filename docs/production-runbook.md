# 单实例生产运行手册

本模板的推荐生产形态是：一个 Node.js 进程、一个持久化 SQLite 文件、一个 HTTPS 反向代理。不要让多个应用实例同时写入同一个数据库文件，也不要把 SQLite 文件放在短生命周期容器文件系统中。

## 部署前提

- Node.js 22、pnpm 10.20.0。
- 应用进程对 `DATABASE_URL` 所在目录有读写权限。
- `BETTER_AUTH_URL` 使用最终的 HTTPS 地址。
- `BETTER_AUTH_SECRET` 是独立生成的高熵密钥，不与其他环境复用。
- `BACKUP_DIRECTORY` 指向另一块磁盘、NAS 或受保护的同步目录。
- 反向代理只转发实际需要的请求头，并覆盖客户端传入的真实 IP 头。

维护命令与应用进程均应显式设置 `NODE_ENV=production`，确保迁移、备份和应用加载相同的生产环境配置；PowerShell 使用 `$env:NODE_ENV = "production"`，POSIX shell 使用 `export NODE_ENV=production`。

## 首次部署

```bash
pnpm install --frozen-lockfile
pnpm env:check
pnpm db:migrate
pnpm auth:bootstrap
pnpm build
pnpm start
```

使用 systemd、PM2 或 Windows Service 管理器保证进程异常退出后自动重启。服务管理器应收集标准输出和标准错误，并配置日志轮转与磁盘空间告警。

## 发布与升级

每次发布严格按以下顺序：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm test:unit
pnpm db:backup
pnpm db:migrate
pnpm build
```

构建成功后再重启应用。重启后依次检查：

1. `GET /api/health/live` 返回 200。
2. `GET /api/health/ready` 返回 200 且数据库状态为 `ok`。
3. 管理员可以登录。
4. 核心读写流程可以完成。

## 回滚

代码异常但迁移兼容时，停止当前进程，切回上一版本并重新构建启动。

迁移不兼容或迁移失败时：

1. 立即停止应用，不继续写入数据库。
2. 保留失败后的数据库文件用于排查。
3. 将发布前备份复制为新的 `DATABASE_URL` 文件。
4. 启动上一版本。
5. 完成 live、ready、登录和核心读写检查。

不要在运行中的管理界面覆盖 SQLite 数据库。

## 备份策略

- 发布、迁移和重要批量操作前运行 `pnpm db:backup`。
- 至少保留每日 7 份和每周 4 份备份；清理前先确认有可用的异地副本。
- 备份目录不要和数据库位于同一故障域。
- 定期在独立临时目录中恢复一份备份，执行迁移和核心读写测试。

## 代理与认证

默认不要信任客户端传入的 `X-Forwarded-For`。部署到反向代理后，只配置由代理覆盖的单值 IP 请求头，或者在 Better Auth 中列出准确的可信代理地址。源站应只允许通过该代理访问。

## 监控边界

`/api/health/live` 适合高频探测，`/api/health/ready` 适合判断数据库是否可用。SQLite 深度完整性检查会随数据量增长，不应由外部监控高频调用。业务错误通过结构化 JSON 日志和 `x-request-id` 关联排查。
