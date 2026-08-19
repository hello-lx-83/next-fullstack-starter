import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Next Fullstack Starter",
  version: packageJson.version,
  copyright: `© ${currentYear}, Next Fullstack Starter.`,
  meta: {
    title: "Next Fullstack Starter - 本地全栈项目模板",
    description: "基于 Next.js 16、SQLite、Drizzle ORM、Better Auth 和 shadcn/ui 的本地优先全栈项目模板。",
  },
};
