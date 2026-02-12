import { ArrowDownUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BaselineCompare({
  smart,
  traditional
}: {
  smart: number;
  traditional: number;
}) {
  const delta = smart - traditional;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowDownUp className="h-4 w-4" />
          مقایسه با روش سنتی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>هوشمند: {Math.round(smart * 100)}%</p>
        <p>سنتی (مبنای مقایسه): {Math.round(traditional * 100)}%</p>
        <p className={delta >= 0 ? "text-success" : "text-danger"}>بهبود: {Math.round(delta * 100)}%</p>
      </CardContent>
    </Card>
  );
}
