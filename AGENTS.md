<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md

## Project overview

Next Fullstack Starter is a local-first full-stack template built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, SQLite, Drizzle ORM, and Better Auth. User-facing copy is Simplified Chinese.

## Next.js documentation

Before any Next.js work, read the relevant documentation in `node_modules/next/dist/docs/`. Local docs are the source of truth.

## shadcn/ui

Use the shadcn skill for work involving shadcn/ui composition or styling. Inspect local wrappers before use. Do not modify files in `src/components/ui/` or `src/components/calendar/`; style and compose them at call sites.

## Package manager and commands

Use pnpm only. Do not create npm, Yarn, or Bun lockfiles.

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm check
pnpm test:unit
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm auth:bootstrap
```

## Architecture

- Routes and layouts: `src/app/`
- Domain components, schemas, and Server Actions: `src/features/<domain>/`
- Authentication and RBAC: `src/server/auth/`
- Database connection and schema: `src/server/db/`
- Authorized data access: `src/server/dal/`
- Shared application UI: `src/components/shared/`
- shadcn primitives: `src/components/ui/`
- Migrations: `drizzle/`

Keep `page.tsx` files small. Server Components query the DAL directly. Use Server Actions for mutations; do not use them for data fetching. Route Handlers are reserved for Better Auth and non-UI HTTP endpoints.

## Security rules

- Treat every Server Action and Route Handler as a public endpoint.
- Validate every external value with Zod.
- Verify the database-backed session close to the data source.
- Enforce project ownership in the mutation query, not only in the UI.
- Proxy performs optimistic cookie checks only and is never the sole authorization layer.
- Return narrow DTOs and never expose password hashes, session tokens, or database paths.
- Public registration, email delivery, OAuth, and multi-tenancy are intentionally out of scope.

## Code conventions

- TypeScript strict mode; avoid `any`.
- Use `@/` aliases.
- Biome: double quotes, semicolons, two spaces, sorted imports, 120-character line width.
- Keep the database empty by default. Do not add seed/demo users or projects.
- Do not commit `.env`, SQLite database, WAL, or SHM files.
- Use Conventional Commit prefixes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
