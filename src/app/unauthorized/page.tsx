import Link from "next/link";

import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <ShieldX className="mx-auto size-8 text-destructive" />
          <CardTitle>没有访问权限</CardTitle>
          <CardDescription>当前账号不能访问这个页面。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">返回工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
