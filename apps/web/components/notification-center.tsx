"use client";

import { BellRing } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimePersian } from "@/lib/format";

export function NotificationCenter({
  items
}: {
  items: Array<{ id: string; message: string; severity: string; created_at: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BellRing className="h-4 w-4" />
          مرکز اعلان‌ها و هشدارها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">هشدار فعالی ثبت نشده است.</p>
        ) : (
          items.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-md border p-2 text-xs">
              <div className="mb-1 flex items-center justify-between gap-2">
                <Badge>{item.severity}</Badge>
                <span className="text-muted-foreground">{formatDateTimePersian(item.created_at)}</span>
              </div>
              <p>{item.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
