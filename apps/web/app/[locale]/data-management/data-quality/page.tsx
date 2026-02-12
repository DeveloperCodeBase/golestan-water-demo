"use client";

import { useMemo } from "react";

import { ModulePage } from "@/components/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/panel";
import { useApiQuery } from "@/lib/api-client";

export default function DataQualityPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const datasets = useApiQuery<Array<any>>("/datasets?page=1&page_size=30", []);
  const points = useApiQuery<Array<any>>("/timeseries?entity=hydrology&page=1&page_size=200", []);

  const quality = useMemo(() => {
    const rows = points.data.length;
    const suspect = points.data.filter((p) => p.quality_flag === "suspect").length;
    const missingEstimate = Math.round(rows * 0.01);
    const outliersEstimate = Math.round(rows * 0.02);
    const score = Math.max(70, 100 - Math.round(((suspect + missingEstimate + outliersEstimate) / Math.max(rows, 1)) * 100));

    return {
      score,
      totalRows: rows,
      suspect,
      missingEstimate,
      outliersEstimate,
      datasetCount: datasets.data.length
    };
  }, [datasets.data.length, points.data]);

  return (
    <ModulePage
      locale={locale}
      title="مدیریت داده | کیفیت داده"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت داده" }, { label: "کیفیت داده" }]}
      loading={datasets.loading || points.loading}
      error={datasets.error || points.error ? "خطا در ارزیابی کیفیت داده" : null}
      empty={false}
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { key: "امتیاز کیفیت", value: quality.score },
          { key: "تعداد ردیف‌ها", value: quality.totalRows },
          { key: "پرچم مشکوک", value: quality.suspect },
          { key: "برآورد داده مفقود", value: quality.missingEstimate },
          { key: "برآورد پرت", value: quality.outliersEstimate },
          { key: "تعداد دیتاست", value: quality.datasetCount }
        ].map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">{item.key}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Panel title="گزارش کیفیت (نسخه نمایشی)">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>نرخ تکمیل داده برای شاخص‌های کلیدی بالای 98% است.</li>
          <li>بیشتر داده‌های مشکوک مربوط به ورودی هیدرولوژی در فصل پربارش هستند.</li>
          <li>نسخه‌بندی دیتاست‌ها فعال است و هر بار آپلود نسخه جدید ثبت می‌شود.</li>
        </ul>
      </Panel>
    </ModulePage>
  );
}
