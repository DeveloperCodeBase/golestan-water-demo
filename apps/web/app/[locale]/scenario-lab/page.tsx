"use client";

import { useEffect, useMemo, useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authedPost, useApiQuery, useAuthProfile } from "@/lib/api-client";
import { formatDatePersian } from "@/lib/format";

export default function ScenarioLabPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token, roles, ready } = useAuthProfile();

  const scenarios = useApiQuery<Array<any>>("/scenarios?page=1&page_size=40", []);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  const [name, setName] = useState("سناریوی سفارشی");
  const [climate, setClimate] = useState("normal");
  const [manualInflow, setManualInflow] = useState(1);
  const [manualMaxRelease, setManualMaxRelease] = useState(260);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const canRunScenario = roles.includes("admin") || roles.includes("operator") || roles.includes("analyst");

  useEffect(() => {
    if (!selectedScenarioId && scenarios.data.length) {
      setSelectedScenarioId(scenarios.data[0].id);
    }
  }, [scenarios.data, selectedScenarioId]);

  const resultsQuery = useApiQuery<Array<any>>(
    selectedScenarioId ? `/scenarios/${selectedScenarioId}/results?page=1&page_size=10` : null,
    [],
    [selectedScenarioId, refreshTick]
  );

  const createAndSimulate = async () => {
    if (!token || !canRunScenario) return;
    setMessage(null);
    setActionLoading(true);
    try {
      const created = await authedPost<any>("/scenarios", token, {
        name: `${name}-${Date.now()}`,
        params: {
          climate,
          horizon_days: 14,
          manual_inflow_adjustment: manualInflow,
          manual_max_release: manualMaxRelease
        }
      });
      await authedPost<any>(`/scenarios/${created.id}/simulate`, token, {});
      setSelectedScenarioId(created.id);
      setRefreshTick((prev) => prev + 1);
      setMessage("سناریوی جدید ساخته شد و شبیه‌سازی با موفقیت انجام شد.");
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی اجرای سناریو برای نقش کاربری شما فعال نیست.");
      } else {
        setMessage("شبیه‌سازی سناریو ناموفق بود.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const simulateSelected = async () => {
    if (!token || !selectedScenarioId || !canRunScenario) return;
    setMessage(null);
    setActionLoading(true);
    try {
      await authedPost<any>(`/scenarios/${selectedScenarioId}/simulate`, token, {});
      setRefreshTick((prev) => prev + 1);
      setMessage("آخرین سناریوی انتخابی با موفقیت شبیه‌سازی شد.");
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی اجرای سناریو برای نقش کاربری شما فعال نیست.");
      } else {
        setMessage("اجرای شبیه‌سازی روی سناریوی انتخابی ناموفق بود.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const baseline = useMemo(
    () => ({
      climate: "normal",
      summary: { shortage_risk: 0.22, spill_risk: 0.15 },
      points: []
    }),
    []
  );

  const latestScenarioResult = resultsQuery.data[0]?.result ?? baseline;
  const points = latestScenarioResult.points ?? [];

  return (
    <ModulePage
      locale={locale}
      title="آزمایشگاه سناریو"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "آزمایشگاه سناریو" }]}
      loading={!ready || scenarios.loading || resultsQuery.loading}
      error={scenarios.error || resultsQuery.error ? "خطا در دریافت داده سناریو" : null}
      empty={false}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>تحلیل چه-می‌شود-اگر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedScenarioId} onChange={(e) => setSelectedScenarioId(e.target.value)}>
              {scenarios.data.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </Select>
            <Button className="w-full" variant="outline" onClick={simulateSelected} disabled={!token || !selectedScenarioId || actionLoading || !canRunScenario}>
              {actionLoading ? "در حال شبیه‌سازی..." : "شبیه‌سازی سناریوی انتخابی"}
            </Button>

            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">ساخت سناریوی جدید</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام سناریو" className="mb-2" />
              <Select value={climate} onChange={(e) => setClimate(e.target.value)}>
                <option value="wet">تر</option>
                <option value="normal">نرمال</option>
                <option value="dry">خشک</option>
              </Select>
              <div className="mt-2">
                <label className="mb-1 block text-xs">ضریب تغییر ورودی فرضی</label>
                <Input type="number" step="0.1" value={manualInflow} onChange={(e) => setManualInflow(Number(e.target.value))} />
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-xs">حداکثر رهاسازی ایمن</label>
                <Input type="number" value={manualMaxRelease} onChange={(e) => setManualMaxRelease(Number(e.target.value))} />
              </div>
              <Button className="mt-2 w-full" onClick={createAndSimulate} disabled={!token || actionLoading || !canRunScenario}>
                ایجاد و اجرای سناریو
              </Button>
            </div>

            {!canRunScenario ? (
              <p className="text-xs text-warning">نقش شما فقط مجوز مشاهده سناریوها را دارد. برای اجرا، نقش تحلیل‌گر/اپراتور نیاز است.</p>
            ) : null}
            {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={`ریسک کمبود (${latestScenarioResult.climate ?? "نرمال"})`}>
              <p className="text-3xl font-black text-danger">{Math.round((latestScenarioResult.summary?.shortage_risk ?? 0) * 100)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">نسبت روزهایی که ذخیره پیش‌بینی‌شده کمتر از حد ایمن بوده است.</p>
            </Panel>
            <Panel title={`ریسک سرریز (${latestScenarioResult.climate ?? "نرمال"})`}>
              <p className="text-3xl font-black text-warning">{Math.round((latestScenarioResult.summary?.spill_risk ?? 0) * 100)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">نسبت روزهایی که ذخیره پیش‌بینی‌شده از مرز هشدار سرریز عبور کرده است.</p>
            </Panel>
          </div>

          <Panel title="خروجی روزانه شبیه‌سازی">
            <div className="space-y-2 sm:hidden">
              {points.length ? (
                points.slice(0, 14).map((row: any, idx: number) => (
                  <article key={`${row.ts}-${idx}`} className="rounded-lg border p-2 text-xs">
                    <p className="font-semibold">{formatDatePersian(row.ts)}</p>
                    <p className="text-muted-foreground">ورودی: {Number(row.inflow).toFixed(2)}</p>
                    <p className="text-muted-foreground">رهاسازی: {Number(row.release).toFixed(2)}</p>
                    <p className="text-muted-foreground">ذخیره: {Number(row.storage).toFixed(2)}</p>
                  </article>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">هنوز خروجی شبیه‌سازی برای این سناریو ثبت نشده است.</p>
              )}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>ورودی</TableHead>
                    <TableHead>رهاسازی</TableHead>
                    <TableHead>ذخیره پیش‌بینی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {points.length ? (
                    points.slice(0, 14).map((row: any, idx: number) => (
                      <TableRow key={`${row.ts}-${idx}`}>
                        <TableCell>{formatDatePersian(row.ts)}</TableCell>
                        <TableCell>{Number(row.inflow).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.release).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.storage).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>هنوز خروجی شبیه‌سازی برای این سناریو ثبت نشده است.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </div>
      </div>
    </ModulePage>
  );
}
