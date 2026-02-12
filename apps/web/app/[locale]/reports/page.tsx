"use client";

import { useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { apiBaseUrl, useApiQuery, useApiToken } from "@/lib/api-client";

export default function ReportsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token } = useApiToken();
  const runs = useApiQuery<Array<any>>("/optimization/runs?page=1&page_size=30", []);
  const [selectedRun, setSelectedRun] = useState<string>("");

  const download = async (format: "csv" | "pdf") => {
    const runId = selectedRun || runs.data[0]?.id;
    if (!token || !runId) return;

    const response = await fetch(`${apiBaseUrl()}/release-plans/${runId}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gozaresh-modiriati-${runId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModulePage
      locale={locale}
      title="گزارش‌ها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "گزارش‌ها" }]}
      loading={runs.loading}
      error={runs.error ? "خطا در دریافت اجراها" : null}
      empty={!runs.loading && runs.data.length === 0}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="گزارش مدیریتی">
          <div className="space-y-3 text-sm">
            <Select value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)}>
              {runs.data.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.name} - {run.params?.scenario === "wet" ? "تر" : run.params?.scenario === "dry" ? "خشک" : "نرمال"}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => download("pdf")}>خروجی پی‌دی‌اف</Button>
              <Button variant="outline" onClick={() => download("csv")}>خروجی سی‌اس‌وی</Button>
            </div>
          </div>
        </Panel>

        <Panel title="گزارش فنی">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>شاخص‌های مدل (MAE/RMSE/MAPE) و پنجره داده آموزشی</li>
            <li>کیفیت داده، نسخه دیتاست و وضعیت اعتبارسنجی</li>
            <li>قیود بهینه‌سازی، وزن اهداف و تحلیل موازنه اهداف</li>
            <li>مقایسه با روش سنتی و میزان بهبود تامین</li>
          </ul>
        </Panel>
      </div>
    </ModulePage>
  );
}
