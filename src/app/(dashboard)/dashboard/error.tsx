"use client";

import { useEffect } from "react";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto w-full max-w-lg text-center">
      <CardHeader>
        <CardTitle>工作台加载失败</CardTitle>
        <CardDescription>数据读取出现问题，请重试；如果问题持续出现，请检查数据库状态。</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={retry}>
          <RotateCcw />
          重新加载
        </Button>
      </CardContent>
    </Card>
  );
}
