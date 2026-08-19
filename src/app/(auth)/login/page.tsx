import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { getSafeDashboardPath } from "@/features/auth/redirect";
import { getCurrentSession } from "@/server/auth/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = getSafeDashboardPath((await searchParams).next);
  if (await getCurrentSession()) redirect(nextPath);

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-heading font-medium text-xl leading-snug">登录工作台</h1>
          <CardDescription>使用管理员创建的账号继续</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </main>
  );
}
