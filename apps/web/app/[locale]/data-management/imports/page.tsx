"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { authedPost, authedUpload, useApiQuery, useAuthProfile } from "@/lib/api-client";

const datasetLabel: Record<string, string> = {
  hydrology_daily: "روزانه هیدرولوژی",
  meteorology_daily: "روزانه هواشناسی",
  reservoir_daily: "روزانه وضعیت مخزن",
  demand_daily: "روزانه تقاضای بخشی"
};

export default function ImportsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token, ready, roles } = useAuthProfile();
  const datasets = useApiQuery<Array<any>>("/datasets?page=1&page_size=30", []);

  const [datasetId, setDatasetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const canImport = useMemo(() => roles.includes("admin") || roles.includes("operator"), [roles]);

  useEffect(() => {
    if (!datasetId && datasets.data.length) {
      setDatasetId(datasets.data[0].id);
    }
  }, [datasets.data, datasetId]);

  const onUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !datasetId || !file || !canImport) return;
    const body = new FormData();
    body.append("file", file);
    setMessage(null);
    setLoadingUpload(true);
    try {
      const data = await authedUpload<{
        dataset_id: string;
        version: number;
        quality_report: { quality_score: number; missing_cells?: number; outliers?: number };
      }>(`/datasets/${datasetId}/upload`, token, body);
      setMessage(
        `آپلود موفق بود | نسخه ${data.version} | امتیاز کیفیت ${data.quality_report.quality_score} | داده مفقود ${data.quality_report.missing_cells ?? 0} | پرت ${data.quality_report.outliers ?? 0}`
      );
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی لازم برای ورود داده برای نقش شما فعال نیست.");
      } else if (err instanceof Error && err.message === "status_400") {
        setMessage("فرمت فایل معتبر نیست. فقط CSV/Excel پشتیبانی می‌شود.");
      } else {
        setMessage("آپلود ناموفق بود. لطفا دیتاست و فایل را بررسی کنید.");
      }
    } finally {
      setLoadingUpload(false);
    }
  };

  const runScheduledImport = async () => {
    if (!token || !datasetId || !canImport) return;
    setMessage(null);
    setLoadingScheduled(true);
    try {
      await authedPost(`/datasets/${datasetId}/scheduled-import/mock`, token, {});
      setMessage("ورود زمان‌بندی‌شده با موفقیت ثبت شد و نسخه جدید در پس‌زمینه ساخته می‌شود.");
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی اجرای ورود زمان‌بندی‌شده برای نقش شما فعال نیست.");
      } else {
        setMessage("اجرای ورود زمان‌بندی‌شده ناموفق بود.");
      }
    } finally {
      setLoadingScheduled(false);
    }
  };

  return (
    <ModulePage
      locale={locale}
      title="مدیریت داده | ورود داده"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت داده" }, { label: "ورود داده" }]}
      loading={!ready || datasets.loading}
      error={datasets.error ? "خطا در دریافت لیست دیتاست‌ها" : null}
      empty={false}
    >
      <Card>
        <CardHeader>
          <CardTitle>بارگذاری فایل سی‌اس‌وی/اکسل + اعتبارسنجی خودکار</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpload} className="space-y-3">
            <label className="block text-xs text-muted-foreground">انتخاب دیتاست هدف</label>
            <Select value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
              {datasets.data.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {datasetLabel[dataset.name] ?? dataset.name} | نسخه {dataset.latest_version}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              شناسه انتخاب‌شده: <span className="font-mono text-foreground">{datasetId || "-"}</span>
            </p>
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button type="submit" className="w-full sm:w-auto" disabled={!token || !file || !datasetId || !canImport || loadingUpload}>
                {loadingUpload ? "در حال آپلود..." : "ارسال و اعتبارسنجی"}
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                variant="outline"
                onClick={runScheduledImport}
                disabled={!token || !datasetId || !canImport || loadingScheduled}
              >
                {loadingScheduled ? "در حال ثبت..." : "ورود زمان‌بندی‌شده (Mock)"}
              </Button>
            </div>
            {!canImport ? (
              <p className="text-xs text-warning">
                نقش فعلی فقط امکان مشاهده دارد. برای ورود داده به نقش اپراتور یا مدیر نیاز است.
              </p>
            ) : null}
            {message ? <p className="text-sm">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>راهنمای دیتاست‌های موجود</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div className="space-y-2 sm:hidden">
            {datasets.data.map((dataset) => (
              <article key={dataset.id} className="rounded-lg border p-2 text-xs">
                <p className="font-semibold text-foreground">{datasetLabel[dataset.name] ?? dataset.name}</p>
                <p>شناسه: <span className="font-mono">{dataset.id}</span></p>
                <p>وضعیت: {dataset.current_status}</p>
                <p>نسخه: {dataset.latest_version}</p>
              </article>
            ))}
          </div>
          <div className="hidden sm:block">
            {datasets.data.map((dataset) => (
              <p key={dataset.id}>
                {datasetLabel[dataset.name] ?? dataset.name}: <span className="font-mono">{dataset.id}</span>
              </p>
            ))}
          </div>
          <p className="pt-2">
            برای ورود زمان‌بندی‌شده، از مسیر `POST /datasets/{'{id}'}/scheduled-import/mock` استفاده کنید.
          </p>
        </CardContent>
      </Card>
    </ModulePage>
  );
}
