# 架构与模块边界

模板采用模块化单体：页面读取 DAL，Server Action 校验表单、调用领域操作并刷新页面；DAL 负责授权、SQL 条件和事务。

## 目录职责

- src/app：路由、布局及 HTTP 适配，不实现数据库操作。
- src/features/<domain>/contracts.ts：前后端共享 DTO，不导入服务端实现。
- src/features/<domain>/schema.ts：输入验证和领域约束。
- src/features/<domain>/actions.ts：表单适配、错误消息与缓存刷新。
- src/server/dal：授权后的查询及业务写入。
- src/server/db/factory.ts：不读取环境、不初始化全局连接的数据库工厂。
- src/server/db/index.ts：应用连接入口，只读取数据库配置。
- tests/helpers/database.ts：使用正式 migrator 初始化完整测试数据库。

## 认证与业务操作

认证 HTTP 入口只开放 GET get-session、GET ok、POST sign-in/email 和 POST sign-out。其余路径返回 403；增加公开端点必须同时审查业务规则和测试。

用户创建、管理员重置密码、本人改密、用户停用和删除、其他会话撤销都由 DAL 执行。密码哈希和验证复用 better-auth/crypto，凭据存储使用当前 Better Auth credential account 模型。调整认证 provider、密码算法或账户模型时，必须同步更新这些操作及登录回归测试。

管理员重置密码会撤销目标的全部会话；本人修改密码需要验证旧密码，只保留当前会话，并通过旧哈希条件防止覆盖并发密码重置。超级管理员的初始化独立于公开 HTTP 入口。

## 审计与事务

用户创建、密码重置、本人改密、停用、删除、项目永久删除和会话撤销均与审计写入共用数据库事务。审计异常向上传播，使业务写入回滚。

审计保存操作者当时的姓名和邮箱；展示与搜索使用快照，不关联当前姓名。新增列通过正式迁移应用，不通过运行时旧字段回退。

登录会话创建由 Better Auth 生命周期管理，使用 session.create.after 钩子记录审计；这条认证库链路不承诺与业务 DAL 相同的事务原子性。

## 前端偏好

当前偏好由浏览器 Cookie 持久化；启动脚本读取偏好，客户端 Store 接管状态。没有通用 Cookie Server Action。

## 验证

单测覆盖 HTTP 入口封锁、授权、会话撤销、审计失败回滚、历史快照及数据库工厂独立性。DAL 测试始终运行全部迁移。E2E 用户创建通过实际界面完成，并验证登录及密码重置流程。
