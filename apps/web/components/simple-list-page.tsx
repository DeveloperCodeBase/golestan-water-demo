"use client";

import { ModulePage } from "@/components/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/api-client";
import { Locale } from "@/lib/i18n";

const keyLabels: Record<string, string> = {
  id: "شناسه",
  name: "نام",
  category: "دسته",
  description: "توضیحات",
  latest_version: "آخرین نسخه",
  current_status: "وضعیت",
  created_at: "زمان ایجاد",
  metric: "شاخص",
  value: "مقدار",
  ts: "زمان",
  entity_type: "نوع موجودیت",
  entity_id: "شناسه موجودیت",
  quality_flag: "کیفیت",
  source: "منبع"
};

function cellValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "-";
  }
  return JSON.stringify(value);
}

export function SimpleListPage({
  locale,
  title,
  breadcrumbs,
  endpoint,
  fallback
}: {
  locale: Locale;
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  endpoint: string;
  fallback?: Array<Record<string, unknown>>;
}) {
  const query = useApiQuery<Array<Record<string, unknown>>>(endpoint, fallback ?? []);
  const rows = query.data ?? [];
  const keys = rows.length ? Object.keys(rows[0]).slice(0, 8) : [];

  return (
    <ModulePage
      locale={locale}
      title={title}
      breadcrumbs={breadcrumbs}
      loading={query.loading}
      error={query.error ? "خطا در دریافت داده" : null}
      empty={!query.loading && rows.length === 0}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  {keys.map((key) => (
                    <TableHead key={key}>{keyLabels[key] ?? key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 30).map((row, idx) => (
                  <TableRow key={`${idx}-${String(row.id ?? idx)}`}>
                    {keys.map((key) => (
                      <TableCell key={key}>{cellValue(row[key])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ModulePage>
  );
}
