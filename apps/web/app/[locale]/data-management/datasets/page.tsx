"use client";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/api-client";
import { formatDatePersian } from "@/lib/format";

const categoryLabel: Record<string, string> = {
  hydrology: "هیدرولوژی",
  meteorology: "هواشناسی",
  reservoir: "مخزن",
  demand: "تقاضا"
};

const datasetLabel: Record<string, string> = {
  hydrology_daily: "روزانه هیدرولوژی (ورودی/خروجی)",
  meteorology_daily: "روزانه هواشناسی",
  reservoir_daily: "روزانه وضعیت مخزن",
  demand_daily: "روزانه تقاضای بخشی آب"
};

const datasetStatusLabel: Record<string, string> = {
  active: "فعال",
  archived: "آرشیو",
  draft: "پیش‌نویس"
};

export default function DatasetsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const datasets = useApiQuery<Array<any>>("/datasets?page=1&page_size=50", []);

  return (
    <ModulePage
      locale={locale}
      title="مدیریت داده | مجموعه‌داده‌ها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت داده" }, { label: "مجموعه‌داده‌ها" }]}
      loading={datasets.loading}
      error={datasets.error ? "خطا در دریافت مجموعه‌داده‌ها" : null}
      empty={!datasets.loading && datasets.data.length === 0}
    >
      <Panel title="ثبت، نسخه‌بندی و پایش وضعیت Datasetها">
        <div className="space-y-2 sm:hidden">
          {datasets.data.map((dataset) => (
            <article key={dataset.id} className="rounded-lg border p-3 text-xs">
              <p className="font-semibold">{datasetLabel[dataset.name] ?? dataset.name}</p>
              <p className="mt-1 text-muted-foreground">دسته: {categoryLabel[dataset.category] ?? dataset.category}</p>
              <p className="text-muted-foreground">نسخه جاری: {dataset.latest_version}</p>
              <p className="text-muted-foreground">ایجاد: {formatDatePersian(dataset.created_at)}</p>
              <div className="mt-2">
                <Badge>{datasetStatusLabel[dataset.current_status] ?? dataset.current_status}</Badge>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>نام دیتاست</TableHead>
                <TableHead>دسته</TableHead>
                <TableHead>نسخه جاری</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>زمان ایجاد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.data.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell>{datasetLabel[dataset.name] ?? dataset.name}</TableCell>
                  <TableCell>{categoryLabel[dataset.category] ?? dataset.category}</TableCell>
                  <TableCell>{dataset.latest_version}</TableCell>
                  <TableCell>
                    <Badge>{datasetStatusLabel[dataset.current_status] ?? dataset.current_status}</Badge>
                  </TableCell>
                  <TableCell>{formatDatePersian(dataset.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </ModulePage>
  );
}
