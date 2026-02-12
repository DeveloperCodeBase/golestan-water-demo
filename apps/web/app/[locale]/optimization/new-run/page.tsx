"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authedPost, useAuthProfile } from "@/lib/api-client";

export default function NewOptimizationRunPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token, roles, ready } = useAuthProfile();

  const [step, setStep] = useState(1);
  const [horizon, setHorizon] = useState(14);
  const [scenario, setScenario] = useState("normal");
  const [weights, setWeights] = useState({ drinking: 1.3, environment: 1.2, industry: 0.9, agriculture: 0.8 });
  const [constraints, setConstraints] = useState({
    min_env_flow: 22,
    min_release: 40,
    max_release: 260,
    min_storage: 280,
    max_storage: 1150
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const canRunOptimization = useMemo(
    () => roles.includes("admin") || roles.includes("operator") || roles.includes("analyst"),
    [roles]
  );

  const sectorFa: Record<string, string> = {
    drinking: "شرب",
    environment: "محیط‌زیست",
    industry: "صنعت",
    agriculture: "کشاورزی"
  };
  const constraintFa: Record<string, string> = {
    min_env_flow: "حداقل دبی محیط‌زیستی",
    min_release: "حداقل رهاسازی",
    max_release: "حداکثر رهاسازی",
    min_storage: "حداقل ذخیره ایمن",
    max_storage: "حداکثر ذخیره ایمن"
  };

  const runOptimization = async () => {
    if (!token || !canRunOptimization) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authedPost<any>("/optimization/run", token, {
        name: `run-${scenario}-${Date.now()}`,
        horizon_days: horizon,
        scenario,
        weights,
        constraints
      });
      setResult(data);
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setError("دسترسی اجرای بهینه‌سازی برای نقش شما فعال نیست.");
      } else {
        setError("اجرای بهینه‌سازی ناموفق بود.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModulePage
      locale={locale}
      title="بهینه‌سازی | اجرای جدید (گام‌به‌گام)"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "بهینه‌سازی" }, { label: "اجرای جدید" }]}
      loading={!ready}
      empty={false}
    >
      <Panel title="توضیح عملکرد بهینه‌ساز">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">مرحله ۱: برآورد ورودی و تقاضا</p>
            <p className="mt-1 text-sm">بر اساس سناریوی تر/نرمال/خشک، ورودی و تقاضای پایه تعدیل می‌شوند.</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">مرحله ۲: اعمال قیود ایمنی</p>
            <p className="mt-1 text-sm">حداقل دبی محیط‌زیستی، کف/سقف رهاسازی و مرزهای ایمن ذخیره در حل لحاظ می‌گردد.</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">مرحله ۳: تخصیص بهینه بخشی</p>
            <p className="mt-1 text-sm">با وزن اهداف، سهم شرب/محیط‌زیست/صنعت/کشاورزی تعیین و ریسک بحران محاسبه می‌شود.</p>
          </div>
        </div>
      </Panel>

      {!canRunOptimization ? (
        <Panel title="عدم دسترسی اجرای مدل">
          <p className="text-sm text-muted-foreground">
            نقش فعلی فقط امکان مشاهده خروجی‌ها را دارد. برای اجرای بهینه‌سازی به نقش تحلیل‌گر، اپراتور یا مدیر نیاز است.
          </p>
        </Panel>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>مرحله {step} از 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs">افق زمانی (روز)</label>
                <Input type="number" value={horizon} min={7} max={30} onChange={(e) => setHorizon(Number(e.target.value))} />
              </div>
              <div>
                <label className="mb-1 block text-xs">سناریوی اقلیمی</label>
                <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  <option value="wet">تر</option>
                  <option value="normal">نرمال</option>
                  <option value="dry">خشک</option>
                </Select>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs">وزن هدف - {sectorFa[key] ?? key}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(constraints).map(([key, value]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs">{constraintFa[key] ?? key}</label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setConstraints((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              مرحله قبلی
            </Button>
            {step < 3 ? (
              <Button className="w-full sm:w-auto" onClick={() => setStep((s) => Math.min(3, s + 1))}>مرحله بعدی</Button>
            ) : (
              <Button className="w-full sm:w-auto" onClick={runOptimization} disabled={loading || !token || !canRunOptimization}>
                {loading ? "در حال اجرای مدل..." : "اجرای بهینه‌سازی"}
              </Button>
            )}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>خلاصه نتیجه اجرای موفق</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">درصد تامین کل</p>
                <p className="text-xl font-black">{Math.round((result.summary?.overall_satisfaction ?? 0) * 100)}%</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">ریسک خشکسالی</p>
                <p className="text-xl font-black">{Math.round((result.summary?.drought_risk ?? 0) * 100)}%</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">ریسک سیلاب</p>
                <p className="text-xl font-black">{Math.round((result.summary?.flood_risk ?? 0) * 100)}%</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">بهبود نسبت به روش مبنا</p>
                <p className="text-xl font-black">{Math.round((result.summary?.baseline?.delta ?? 0) * 100)}%</p>
              </div>
            </div>

            <div className="space-y-2 sm:hidden">
              {Object.entries(result.summary?.satisfaction_by_sector ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{sectorFa[key] ?? key}</p>
                  <p className="text-base font-bold">{Math.round(Number(value) * 100)}%</p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>بخش</TableHead>
                    <TableHead>درصد تامین</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(result.summary?.satisfaction_by_sector ?? {}).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{sectorFa[key] ?? key}</TableCell>
                      <TableCell>{Math.round(Number(value) * 100)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p>
              <Link className="text-primary underline" href={`/${locale}/optimization/release-plans?run_id=${result.id}`}>
                مشاهده برنامه رهاسازی و خروجی گزارش
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}
    </ModulePage>
  );
}
