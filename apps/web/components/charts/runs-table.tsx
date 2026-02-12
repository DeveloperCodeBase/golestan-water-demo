"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimePersian } from "@/lib/format";

export type RunRow = {
  id: string;
  scenario: string;
  horizon: number;
  satisfaction: number;
  risk: number;
  created_at: string;
};

function scenarioLabel(value: string) {
  if (value === "wet") return "تر";
  if (value === "dry") return "خشک";
  return "نرمال";
}

export function RunsTable({ data }: { data: RunRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<RunRow>[]>(
    () => [
      { accessorKey: "id", header: "شناسه اجرا" },
      { accessorKey: "scenario", header: "سناریو", cell: (ctx) => scenarioLabel(String(ctx.getValue())) },
      { accessorKey: "horizon", header: "افق (روز)" },
      {
        accessorKey: "satisfaction",
        header: "تامین",
        cell: (ctx) => `${Math.round(Number(ctx.getValue()) * 100)}%`
      },
      {
        accessorKey: "risk",
        header: "ریسک",
        cell: (ctx) => `${Math.round(Number(ctx.getValue()) * 100)}%`
      },
      {
        accessorKey: "created_at",
        header: "زمان ایجاد",
        cell: (ctx) => formatDateTimePersian(String(ctx.getValue()))
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting
  });

  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-2">
      <Table className="min-w-[720px]">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id} className="cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
