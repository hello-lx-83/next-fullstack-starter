# Better Auth 基础设施评估

评估日期：2026-09-04。已安装 Better Auth 1.6.29；package.json 声明范围为 ^1.4.7。新增插件时须核对锁定版本的 API 与迁移要求。

## 结论

继续使用 Better Auth 作为身份、账号和会话基础设施。现有认证无需重建。优先扩展管理员会话管理与管理员 TOTP；Passkey 和 API Key 根据场景接入。中文界面、业务授权、审计留存和恢复流程仍由项目实现。

## 已有实现

| 模块 | 当前状态 | 代码依据 |
| --- | --- | --- |
| 邮箱密码登录 | 已启用；默认关闭公开注册；最小密码长度 8 | src/server/auth/index.ts |
| 数据库会话 | Drizzle + SQLite；未开启 Cookie 会话缓存 | src/server/auth/index.ts、session.ts |
| 个人安全中心 | 自己的会话列表与撤销、个人资料和密码修改 | src/server/dal/sessions.ts、src/features/profile/、src/features/sessions/ |
| 用户管理 | 创建普通用户、停用/启用、删除、重置密码并撤销会话 | src/features/users/actions.ts、src/server/dal/users.ts |
| 管理权限 | Admin 插件不授予管理写入权限；全部业务管理操作通过项目 DAL；引导流程维护唯一管理员 | src/server/auth/index.ts、single-admin.ts |
| 请求保护 | 认证 HTTP 入口白名单；登录数据库限流；Origin 与 CSRF 校验 | src/server/auth/index.ts |
| 审计 | 会话创建 Hook；业务变更与审计共用事务，保存操作者快照 | src/server/audit.ts、src/server/dal/audit.ts |

Admin 插件的默认能力大于当前开放范围。不能为了增加菜单而恢复全部默认权限，否则会改变唯一管理员策略。业务项目的拥有者检查继续在 DAL 和写入查询中执行。

## 可扩展模块

| 模块 | Better Auth 能力 | 建议 |
| --- | --- | --- |
| 管理员会话管理 | 查看用户会话、撤销单个或全部会话 | 优先；增加最小权限和管理页面。界面仅传会话 ID，令牌由服务端处理 |
| TOTP 双因素认证 | 验证器、备份码、受信任设备 | 优先面向管理员；需数据库迁移、绑定/验证界面及恢复流程，不依赖邮件 |
| Passkey | WebAuthn 登录和凭证管理 | 按需；额外插件、迁移、稳定域名和安全上下文。localhost 与局域网 HTTP 使用条件不同 |
| API Key | 密钥创建、校验、权限、过期、限流 | 有脚本或第三方 API 集成时加入；仍需 HTTP 端点和业务数据授权 |
| 细粒度角色权限 | Access Control 的资源与操作权限 | 暂缓；现有 admin/user 足够，新角色会改变当前权限模型 |
| Organization | 组织、成员、邀请、团队与组织角色 | 暂不接入；多租户不在项目范围内，业务表隔离需另行设计 |
| 审计扩展 | Hooks 连接自建日志系统 | 可补充失败登录与敏感操作记录；脱敏、留存、导出和防篡改由项目建设 |

邮件验证、邮件找回密码、Magic Link 和邮件 OTP 需要邮件投递能力；OAuth/SSO 需要身份提供方配置。当前项目明确排除邮件、OAuth 和多租户，本次不接入。

备份恢复、文件存储、任务队列、通知系统和业务数据归属控制，不由上述认证模块代替。

官方参考：
- [Admin](https://better-auth.com/docs/plugins/admin)
- [Session Management](https://better-auth.com/docs/concepts/session-management)
- [Two Factor](https://better-auth.com/docs/plugins/2fa)
- [Passkey](https://better-auth.com/docs/plugins/passkey)
- [API Key](https://better-auth.com/docs/plugins/api-key)
- [Organization](https://better-auth.com/docs/plugins/organization)
- [Hooks](https://better-auth.com/docs/concepts/hooks)

## 本次导航调整

- 主侧边栏“工作区”下新增“管理”，仅管理员渲染。
- 用户页面为 /dashboard/users；审计日志为 /dashboard/audit。
- 设置导航移除管理分组，其余设置保留。
- 仅提供当前用户和审计页面，不保留旧地址。审计页面校验筛选与页码参数。
- 用户和审计 DAL 保留 requireAdmin，写入操作在 DAL 内独立鉴权。
- 用户变更刷新新路由，面包屑显示“管理 / 用户”或“管理 / 审计日志”。
- 复用 Sidebar 包装，不修改 src/components/ui/ 或 src/components/calendar/。

本次仅迁移既有管理功能，不安装新插件、不改变角色权限、不迁移业务数据库。
