"use client";

import { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Locale } from "@/lib/i18n";

export function ModulePage({
  locale,
  title,
  breadcrumbs,
  loading,
  error,
  empty,
  children
}: {
  locale: Locale;
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="fade-in-up space-y-4">
      <PageHeader locale={locale} title={title} breadcrumbs={breadcrumbs} />
      {loading ? <LoadingState /> : null}
      {!loading && error ? <ErrorState label={error} /> : null}
      {!loading && !error && empty ? <EmptyState label="هنوز داده‌ای برای نمایش ثبت نشده است." /> : null}
      {!loading && !error && !empty ? children : null}
    </div>
  );
}
