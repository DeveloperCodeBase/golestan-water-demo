"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { JalaliDateInput } from "@/components/jalali-date-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function FilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="ml-2 h-4 w-4" />
          فیلترها
        </Button>
      </DialogTrigger>
      <DialogContent className="right-0 left-auto text-right" dir="rtl">
        <DialogTitle className="mb-4 text-sm font-semibold">فیلترهای عملیاتی</DialogTitle>
        <div className="space-y-3">
          <Select defaultValue="normal">
            <option value="wet">تر</option>
            <option value="normal">نرمال</option>
            <option value="dry">خشک</option>
          </Select>
          <Input placeholder="جست‌وجو در داده‌ها..." />
          <JalaliDateInput placeholder="تاریخ مرجع (شمسی)" />
          <Button className="w-full" onClick={() => setOpen(false)}>
            اعمال فیلتر
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
