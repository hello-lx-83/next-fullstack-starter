import Image from "next/image";
import { redirect } from "next/navigation";

import { GalleryVerticalEndIcon } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { LoginForm } from "@/features/auth/login-form";
import { getSafeDashboardPath } from "@/features/auth/redirect";
import { getCurrentSession } from "@/server/auth/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = getSafeDashboardPath((await searchParams).next);
  if (await getCurrentSession()) redirect(nextPath);

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" aria-hidden="true" />
            </div>
            {APP_CONFIG.name}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-xs">
            <LoginForm nextPath={nextPath} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block" aria-hidden="true">
        <Image
          src="/login-cover.svg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </main>
  );
}
