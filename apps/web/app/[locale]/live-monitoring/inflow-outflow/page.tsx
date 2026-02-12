"use client";

import { useMemo } from "react";

import { InflowChart } from "@/components/charts/inflow-chart";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/api-client";
import { lineSeriesMock } from "@/lib/demo-data";
import { formatDatePersian } from "@/lib/format";

export default function InflowOutflowPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const inflow = useApiQuery<Array<any>>("/timeseries?metric=inflow&page=1&page_size=30", []);
  const outflow = useApiQuery<Array<any>>("/timeseries?metric=outflow&page=1&page_size=30", []);

  const rows = useMemo(() => {
    if (!inflow.data.length || !outflow.data.length) {
      return lineSeriesMock.map((row, index) => ({ id: index, ts: row.day, inflow: row.inflow, outflow: row.outflow }));
    }

    const maxLen = Math.min(inflow.data.length, outflow.data.length, 30);
    return Array.from({ length: maxLen }).map((_, idx) => {
      const i = maxLen - idx - 1;
      return {
        id: i,
        ts: inflow.data[i].ts,
        inflow: inflow.data[i].value,
        outflow: outflow.data[i].value
      };
    });
  }, [inflow.data, outflow.data]);

  const chartData = rows.map((row) => ({
    day: typeof row.ts === "string" && row.ts.includes("T") ? formatDatePersian(row.ts) : String(row.ts),
    inflow: row.inflow,
    outflow: row.outflow,
    storage: row.inflow - row.outflow + 700
  }));

  return (
    <ModulePage
      locale={locale}
      title="پایش زنده | ورودی و خروجی"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "پایش زنده" }, { label: "ورودی و خروجی" }]}
      loading={inflow.loading || outflow.loading}
      error={inflow.error || outflow.error ? "خطا در دریافت داده هیدرولوژی" : null}
      empty={false}
    >
      <Panel title="نمودار روند ورودی و خروجی">
        <InflowChart data={chartData} />
      </Panel>

      <Panel title="جدول روزانه ورودی/خروجی">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>تاریخ</TableHead>
                <TableHead>ورودی</TableHead>
                <TableHead>خروجی</TableHead>
                <TableHead>خالص</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 20).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{typeof row.ts === "string" && row.ts.includes("T") ? formatDatePersian(row.ts) : row.ts}</TableCell>
                  <TableCell>{row.inflow.toFixed(2)}</TableCell>
                  <TableCell>{row.outflow.toFixed(2)}</TableCell>
                  <TableCell>{(row.inflow - row.outflow).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </ModulePage>
  );
}
