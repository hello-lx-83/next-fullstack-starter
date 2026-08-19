"use client";

import { useEffect } from "react";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto w-full max-w-lg text-center">
      <CardHeader>
        <CardTitle>项目加载失败</CardTitle>
        <CardDescription>读取项目数据时出现问题，请重试；如果问题持续出现，请检查本地数据库。</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          重新加载
        </Button>
      </CardContent>
    </Card>
  );
}
