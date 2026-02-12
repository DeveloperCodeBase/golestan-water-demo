"use client";

import { useMemo, useState } from "react";

import { NotificationCenter } from "@/components/notification-center";
import { RiskGauge } from "@/components/charts/risk-gauge";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { authedPost, useApiQuery, useAuthProfile } from "@/lib/api-client";

const severityLabel: Record<string, string> = {
  high: "خیلی مهم",
  medium: "متوسط",
  low: "کم"
};

export default function CrisisCenterPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token } = useAuthProfile();
  const alerts = useApiQuery<Array<any>>("/alerts?page=1&page_size=30", []);
  const runs = useApiQuery<Array<any>>("/optimization/runs?page=1&page_size=1", []);

  const [message, setMessage] = useState<string | null>(null);
  const [loadingEvaluate, setLoadingEvaluate] = useState(false);

  const droughtRisk = Number(runs.data[0]?.summary?.drought_risk ?? 0.34);
  const floodRisk = Number(runs.data[0]?.summary?.flood_risk ?? 0.23);

  const evaluateRules = async () => {
    if (!token) {
      setMessage("برای ارزیابی هشدارها ابتدا وارد سامانه شوید.");
      return;
    }
    setLoadingEvaluate(true);
    setMessage(null);
    try {
      const res = await authedPost<{ created: number }>("/alerts/evaluate", token, {});
      setMessage(`${res.created} هشدار جدید با موفقیت ثبت شد.`);
    } catch (err) {
      if (err instanceof Error && err.message === "status_403") {
        setMessage("دسترسی لازم برای ارزیابی هشدارها فعال نیست.");
      } else {
        setMessage("ارزیابی قوانین هشدار ناموفق بود.");
      }
    } finally {
      setLoadingEvaluate(false);
    }
  };

  const localizedAlerts = useMemo(
    () =>
      alerts.data.map((item) => ({
        ...item,
        severity: severityLabel[item.severity] ?? item.severity
      })),
    [alerts.data]
  );

  return (
    <ModulePage
      locale={locale}
      title="مرکز بحران و هشدارها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مرکز بحران و هشدارها" }]}
      loading={alerts.loading || runs.loading}
      error={alerts.error || runs.error ? "خطا در بارگذاری داده‌های بحران" : null}
      empty={false}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <RiskGauge value={droughtRisk} label="ریسک خشکسالی" />
        <RiskGauge value={floodRisk} label="ریسک سیلاب" />
        <Panel title="ارزیابی خودکار قوانین هشدار">
          <p className="mb-2 text-xs text-muted-foreground">
            با اجرای این گزینه، قواعد آستانه‌ای روی آخرین داده‌های سری زمانی بررسی می‌شود و در صورت عبور از آستانه، هشدار جدید
            ثبت می‌گردد.
          </p>
          <Button onClick={evaluateRules} disabled={loadingEvaluate}>
            {loadingEvaluate ? "در حال ارزیابی..." : "اجرای موتور هشدار"}
          </Button>
          {message ? <p className="mt-2 text-xs">{message}</p> : null}
        </Panel>
      </div>

      <div className="mt-4">
        <NotificationCenter items={localizedAlerts} />
      </div>
    </ModulePage>
  );
}

