"use client";

import { FormEvent, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiBaseUrl, useApiQuery, useApiToken } from "@/lib/api-client";

const datasetLabel: Record<string, string> = {
  hydrology_daily: "روزانه هیدرولوژی",
  meteorology_daily: "روزانه هواشناسی",
  reservoir_daily: "روزانه وضعیت مخزن",
  demand_daily: "روزانه تقاضای بخشی"
};

export default function ImportsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token, ready } = useApiToken();
  const datasets = useApiQuery<Array<any>>("/datasets?page=1&page_size=30", []);

  const [datasetId, setDatasetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !datasetId || !file) return;
    const body = new FormData();
    body.append("file", file);

    const res = await fetch(`${apiBaseUrl()}/datasets/${datasetId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body
    });

    if (!res.ok) {
      setMessage("آپلود ناموفق بود.");
      return;
    }

    const json = await res.json();
    setMessage(`آپلود موفق بود | نسخه جدید: ${json.data.version} | امتیاز کیفیت: ${json.data.quality_report.quality_score}`);
  };

  return (
    <ModulePage
      locale={locale}
      title="مدیریت داده | ورود داده"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت داده" }, { label: "ورود داده" }]}
      loading={!ready || datasets.loading}
      empty={false}
    >
      <Card>
        <CardHeader>
          <CardTitle>بارگذاری فایل سی‌اس‌وی/اکسل + اعتبارسنجی خودکار</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpload} className="space-y-3">
            <label className="block text-xs text-muted-foreground">شناسه دیتاست</label>
            <Input placeholder="برای نمونه: hydrology_daily" value={datasetId} onChange={(e) => setDatasetId(e.target.value)} />
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button type="submit" disabled={!token || !file || !datasetId}>
              ارسال و اعتبارسنجی
            </Button>
            {message ? <p className="text-sm">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>راهنمای شناسه دیتاست‌های موجود</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {datasets.data.map((dataset) => (
            <p key={dataset.id}>
              {datasetLabel[dataset.name] ?? dataset.name}: <span className="font-mono">{dataset.id}</span>
            </p>
          ))}
          <p className="pt-2">
            برای ورود زمان‌بندی‌شده، از مسیر `POST /datasets/{'{id}'}/scheduled-import/mock` استفاده کنید.
          </p>
        </CardContent>
      </Card>
    </ModulePage>
  );
}
