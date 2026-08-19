import Link from "next/link";

import { ArrowLeft, FolderX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectNotFound() {
  return (
    <Card className="mx-auto w-full max-w-lg text-center">
      <CardHeader>
        <FolderX className="mx-auto size-8 text-muted-foreground" />
        <CardTitle>项目不存在</CardTitle>
        <CardDescription>项目可能已被删除，或者当前账号没有查看权限。</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft data-icon="inline-start" />
            返回项目列表
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
