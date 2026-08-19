import { NextRequest } from "next/server";

import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

describe("请求代理", () => {
  it("为普通请求生成关联 ID", () => {
    const response = proxy(new NextRequest("http://localhost:3009/login"));
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("未登录访问工作区时跳转并保留关联 ID", () => {
    const response = proxy(new NextRequest("http://localhost:3009/dashboard/projects"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3009/login?next=%2Fdashboard%2Fprojects");
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
