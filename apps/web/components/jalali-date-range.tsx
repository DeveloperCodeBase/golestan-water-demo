"use client";

import { useState } from "react";

import { JalaliDateInput } from "@/components/jalali-date-input";

export function JalaliDateRange() {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-[420px]">
      <JalaliDateInput value={fromDate} onChange={setFromDate} placeholder="از تاریخ (شمسی)" />
      <JalaliDateInput value={toDate} onChange={setToDate} placeholder="تا تاریخ (شمسی)" />
    </div>
  );
}

