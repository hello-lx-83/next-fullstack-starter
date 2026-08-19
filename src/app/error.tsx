"use client";

import { useEffect } from "react";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>页面暂时无法显示</CardTitle>
          <CardDescription>应用遇到了意外问题，请重试；如果问题持续出现，请检查本地终端日志。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={retry}>
            <RotateCcw />
            重试
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
