"use client";

import { useMemo, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery, useAuthProfile } from "@/lib/api-client";
import { formatDateTimePersian } from "@/lib/format";

export default function AuditLogsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { roles, ready } = useAuthProfile();
  const [filter, setFilter] = useState("");

  const canReadAudit = useMemo(() => roles.includes("admin") || roles.includes("auditor"), [roles]);
  const logs = useApiQuery<Array<any>>(
    canReadAudit ? `/audit-logs?page=1&page_size=50&filter=${encodeURIComponent(filter)}` : null,
    [],
    [filter, canReadAudit]
  );

  return (
    <ModulePage
      locale={locale}
      title="مدیریت سامانه | گزارش ممیزی"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت سامانه" }, { label: "گزارش ممیزی" }]}
      loading={!ready || (canReadAudit && logs.loading)}
      error={canReadAudit && logs.error ? "خطا در دریافت لاگ ممیزی" : null}
      empty={false}
    >
      {!canReadAudit ? (
        <Panel title="عدم دسترسی">
          <p className="text-sm text-muted-foreground">
            مشاهده گزارش ممیزی برای نقش ممیز یا مدیر سامانه فعال است.
          </p>
        </Panel>
      ) : (
        <Panel title="ردیابی تغییرات (مسیر ممیزی)">
          <Input
            placeholder="فیلتر بر اساس نوع عملیات یا موجودیت"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-3 max-w-sm"
          />
          <div className="overflow-x-auto">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead>زمان</TableHead>
                  <TableHead>عملیات</TableHead>
                  <TableHead>موجودیت</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateTimePersian(row.created_at)}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.entity}</TableCell>
                    <TableCell>{row.actor_user_id ?? "-"}</TableCell>
                    <TableCell className="max-w-[340px] truncate">{JSON.stringify(row.details)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </ModulePage>
  );
}

