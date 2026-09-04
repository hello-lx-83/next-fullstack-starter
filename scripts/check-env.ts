import { ZodError } from "zod";

import { getServerEnv } from "../src/config/env";
import { loadLocalEnv } from "./lib/load-env";

loadLocalEnv();

try {
  getServerEnv();
  console.info("服务端环境配置校验通过");
} catch (error) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      console.error(`环境配置无效：${issue.path.join(".")}，${issue.message}`);
    }
  } else {
    console.error("环境配置校验失败");
  }
  process.exitCode = 1;
}
