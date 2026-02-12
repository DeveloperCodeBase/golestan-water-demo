"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authedPost } from "@/lib/api-client";

type ExplainResponse = {
  run_id: string;
  explanation: string;
  reasons: string[];
  warnings: string[];
};

export function ExplainPanel({ token, defaultRunId }: { token: string | null; defaultRunId?: string }) {
  const [runId, setRunId] = useState(defaultRunId ?? "");
  const [context, setContext] = useState('{"scenario":"normal"}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onExplain = async () => {
    if (!token || !runId) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(context || "{}");
      const data = await authedPost<ExplainResponse>("/llm/explain", token, {
        run_id: runId,
        context: parsed
      });
      setResult(data);
    } catch {
      setError("خطا در تولید توضیح تصمیم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>پنل توضیح تصمیم (LLM Stub)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="شناسه اجرای بهینه‌سازی (run_id)" value={runId} onChange={(e) => setRunId(e.target.value)} />
        <Textarea value={context} onChange={(e) => setContext(e.target.value)} />
        <Button onClick={onExplain} disabled={loading || !token || !runId}>
          {loading ? "در حال پردازش..." : "تولید توضیح"}
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {result ? (
          <div className="rounded-md border p-3 text-sm">
            <p className="mb-2">{result.explanation}</p>
            <ul className="list-inside list-disc space-y-1 text-xs">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {result.warnings.length ? (
              <div className="mt-2 rounded bg-warning/20 p-2 text-xs">
                {result.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
