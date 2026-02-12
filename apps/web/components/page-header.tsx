"use client";

import Link from "next/link";
import { CalendarRange, Download, Share2 } from "lucide-react";

import { FilterDrawer } from "@/components/filter-drawer";
import { JalaliDateRange } from "@/components/jalali-date-range";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n";

export function PageHeader({
  locale,
  title,
  breadcrumbs
}: {
  locale: Locale;
  title: string;
  breadcrumbs: { label: string; href?: string }[];
}) {
  return (
    <header className="mb-4 rounded-2xl border bg-card/90 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <nav className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, idx) => (
                <span key={`${crumb.label}-${idx}`}>
                  {crumb.href ? <Link href={`/${locale}${crumb.href}`}>{crumb.label}</Link> : crumb.label}
                  {idx < breadcrumbs.length - 1 ? " / " : ""}
                </span>
              ))}
            </nav>
            <h1 className="text-lg font-black md:text-xl">{title}</h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              بازه زمانی شمسی
            </span>
            <JalaliDateRange />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDrawer />
            <Button variant="outline" size="sm">
              <Download className="ml-2 h-4 w-4" />
              خروجی
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="ml-2 h-4 w-4" />
              اشتراک
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
