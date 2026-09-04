import { describe, expect, it } from "vitest";

import { parseUserListQuery, userListHref } from "@/features/users/schema";

describe("用户列表查询", () => {
  it("为非法页码、分页大小和筛选值提供安全默认值", () => {
    expect(parseUserListQuery({ page: "-1", pageSize: "9999", role: "owner", status: "invalid", sort: "sql" })).toEqual(
      { q: "", page: 1, pageSize: 20, role: "all", status: "all", sort: "created-desc" },
    );
    expect(parseUserListQuery({ page: "1e100" }).page).toBe(1);
  });
  it("解析重复参数并保留搜索文本与合法条件", () => {
    const query = parseUserListQuery({
      q: [" 姓名 & 邮箱 ", "ignored"],
      role: "user",
      status: "banned",
      page: "3",
      pageSize: "10",
      sort: "name-desc",
    });
    const url = new URL(userListHref(query), "http://localhost");
    expect(parseUserListQuery(Object.fromEntries(url.searchParams))).toEqual(query);
    expect(query.q).toBe("姓名 & 邮箱");
    expect(userListHref(query, { page: 1 })).not.toContain("page=3");
  });
});
