import type { ReactNode } from "react";

import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { fontVars } from "@/lib/fonts/loaded";
import { PREFERENCE_DEFAULTS, PREFERENCE_KEYS, PREFERENCE_REGISTRY } from "@/lib/preferences/preferences-config";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const attributes = Object.fromEntries(
    PREFERENCE_KEYS.map((key) => [PREFERENCE_REGISTRY[key].attribute, PREFERENCE_DEFAULTS[key]]),
  );
  return (
    <html lang="zh-CN" className={fontVars} {...attributes} suppressHydrationWarning>
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body className="min-h-screen antialiased">
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
