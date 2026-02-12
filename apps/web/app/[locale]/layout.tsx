import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { getLocale } from "@/lib/i18n";

export default function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: any;
}) {
  const locale = getLocale(params.locale);
  if (params.locale !== locale) {
    redirect(`/${locale}`);
  }

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"}>
      <AuthGate>
        <AppShell locale={locale}>{children}</AppShell>
      </AuthGate>
    </div>
  );
}
