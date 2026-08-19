"use client";

import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <main className="grid min-h-screen place-items-center bg-white p-4 text-slate-950">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 p-6 text-center shadow-sm">
            <h1 className="font-semibold text-xl">应用启动失败</h1>
            <p className="text-slate-600 text-sm">根布局遇到了意外问题，请重试或查看本地终端日志。</p>
            <button
              type="button"
              className="rounded-lg bg-slate-950 px-4 py-2 font-medium text-sm text-white"
              onClick={retry}
            >
              重试
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
