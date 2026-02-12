"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { cn } from "@/lib/utils";

type Props = {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  className?: string;
};

export function JalaliDateInput({ value, onChange, placeholder = "انتخاب تاریخ", className }: Props) {
  return (
    <DatePicker
      value={value ?? ""}
      onChange={(picked: any) => {
        if (!picked) {
          onChange?.(null);
          return;
        }
        onChange?.(picked.toDate?.() ?? null);
      }}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/MM/DD"
      calendarPosition="bottom-right"
      inputClass={cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/40",
        className
      )}
      containerClassName="w-full"
      placeholder={placeholder}
    />
  );
}

