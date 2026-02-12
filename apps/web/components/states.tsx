import { AlertTriangle, Database, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 items-center justify-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ label = "داده‌ای برای نمایش نیست." }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
        <Database className="h-8 w-8" />
        <p>{label}</p>
      </CardContent>
    </Card>
  );
}

export function ErrorState({ label = "خطا در دریافت داده", onRetry }: { label?: string; onRetry?: () => void }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 flex-col items-center justify-center gap-4 py-10 text-center">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p>{label}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            تلاش مجدد
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
