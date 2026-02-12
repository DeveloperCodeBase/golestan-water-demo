"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ReleaseHeatmap } from "@/components/charts/release-heatmap";
import { SatisfactionBar } from "@/components/charts/satisfaction-bar";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiBaseUrl, useApiQuery, useApiToken } from "@/lib/api-client";
import { formatDatePersian } from "@/lib/format";

const sectorLabel: Record<string, string> = {
  drinking: "شرب",
  environment: "محیط‌زیست",
  industry: "صنعت",
  agriculture: "کشاورزی"
};

export default function ReleasePlansPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const searchParams = useSearchParams();
  const startRunId = searchParams.get("run_id") ?? "";

  const runsQuery = useApiQuery<Array<any>>("/optimization/runs?page=1&page_size=20", []);
  const [runId, setRunId] = useState(startRunId);
  const { token } = useApiToken();

  useEffect(() => {
    if (!runId && runsQuery.data.length) {
      setRunId(runsQuery.data[0].id);
    }
  }, [runId, runsQuery.data]);

  const planQuery = useApiQuery<{ run: any; rows: Array<any> }>(
    runId ? `/release-plans/${runId}` : null,
    { run: null, rows: [] },
    [runId]
  );

  const satisfactionData = useMemo(() => {
    const sat = planQuery.data.run?.summary?.satisfaction_by_sector ?? {
      drinking: 0.9,
      environment: 0.88,
      industry: 0.8,
      agriculture: 0.74
    };
    return Object.entries(sat).map(([sector, satisfaction]) => ({
      sector: sectorLabel[sector] ?? sector,
      satisfaction: Number(satisfaction)
    }));
  }, [planQuery.data.run]);

  const exportFile = async (format: "csv" | "pdf") => {
    if (!token || !runId) return;
    const response = await fetch(`${apiBaseUrl()}/release-plans/${runId}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barname-rahasazi-${runId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModulePage
      locale={locale}
      title="بهینه‌سازی | برنامه‌های رهاسازی"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "بهینه‌سازی" }, { label: "برنامه رهاسازی" }]}
      loading={runsQuery.loading || planQuery.loading}
      error={runsQuery.error || (planQuery.error && runId ? "خطا در دریافت برنامه رهاسازی" : null)}
      empty={!runsQuery.loading && runsQuery.data.length === 0}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={runId} onChange={(e) => setRunId(e.target.value)} className="max-w-md">
          {runsQuery.data.map((run) => (
            <option key={run.id} value={run.id}>
              {run.name} - {(run.params?.scenario === "wet" ? "تر" : run.params?.scenario === "dry" ? "خشک" : "نرمال")}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={() => exportFile("csv")}>خروجی سی‌اس‌وی</Button>
        <Button variant="outline" onClick={() => exportFile("pdf")}>خروجی پی‌دی‌اف</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ReleaseHeatmap rows={planQuery.data.rows} />
        </div>
        <Panel title="درصد تامین بخش‌ها">
          <SatisfactionBar data={satisfactionData} />
        </Panel>
      </div>

      <Panel title="جدول برنامه رهاسازی">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>تاریخ</TableHead>
                <TableHead>رهاسازی</TableHead>
                <TableHead>ذخیره پیش‌بینی</TableHead>
                <TableHead>ریسک</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planQuery.data.rows.slice(0, 40).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDatePersian(row.ts)}</TableCell>
                  <TableCell>{row.release_value?.toFixed?.(2) ?? row.release_value}</TableCell>
                  <TableCell>{row.storage_projection?.toFixed?.(2) ?? row.storage_projection}</TableCell>
                  <TableCell>{row.risk_index?.toFixed?.(2) ?? row.risk_index}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </ModulePage>
  );
}
