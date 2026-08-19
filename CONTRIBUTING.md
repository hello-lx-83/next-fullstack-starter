# 参与贡献

感谢参与改进 Next Fullstack Starter。

## 开发流程

1. 使用 Node.js 22+ 和 pnpm 10.20.0。
2. 执行 `pnpm install`，复制并配置 `.env.example`。
3. 执行 `pnpm run setup` 和 `pnpm dev`。
4. 保持改动聚焦，不提交 `.env`、SQLite 数据库或演示数据。
5. 提交前运行：

```bash
pnpm check
pnpm typecheck
pnpm test:unit
pnpm build
```

涉及用户流程或权限时还需运行 `pnpm test:e2e`。

## 代码约定

- 使用严格 TypeScript，避免 `any`。
- Server Component 默认负责查询，Server Action 负责写入。
- 每个 DAL、Server Action 和 Route Handler 都必须独立鉴权。
- 对外只返回 DTO，不把数据库整行直接传给客户端。
- 使用 Zod 校验所有外部输入。
- 遵循 Biome 的双引号、分号、两空格缩进和导入排序规则。
- 使用 Conventional Commits：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`、`chore:`。

数据库变更必须同时提交 Drizzle schema 和生成的 migration，并说明升级方式。
