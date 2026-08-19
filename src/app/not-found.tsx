import Link from "next/link";

import { House } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="font-bold text-8xl text-muted-foreground/30">404</div>
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl">页面不存在</h1>
        <p className="max-w-md text-muted-foreground">你访问的页面不存在，或已经被移动。</p>
      </div>
      <Button asChild>
        <Link href="/">
          <House />
          返回首页
        </Link>
      </Button>
    </main>
  );
}
