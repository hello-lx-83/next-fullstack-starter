import { describe, expect, it } from "vitest";

import { parseProjectListQuery, projectListHref } from "@/features/projects/schema";

describe("Project list query", () => {
  it("规范化 URL 参数并为无效值提供安全默认值", () => {
    expect(
      parseProjectListQuery({
        q: ["  Alpha  ", "ignored"],
        status: "unknown",
        sort: "name-asc",
        page: "0",
        pageSize: "50",
      }),
    ).toEqual({ q: "Alpha", status: "all", sort: "name-asc", page: 1, pageSize: 50 });
  });

  it("只把非默认状态写入列表链接", () => {
    const href = projectListHref(
      { q: "Alpha", status: "active", sort: "updated-desc", page: 3, pageSize: 20 },
      { page: 1 },
    );
    expect(href).toBe("/dashboard/projects?q=Alpha&status=active");
  });
});
