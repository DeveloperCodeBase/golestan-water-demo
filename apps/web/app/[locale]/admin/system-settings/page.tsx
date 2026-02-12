"use client";

import { useState } from "react";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthProfile } from "@/lib/api-client";

export default function SystemSettingsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { roles } = useAuthProfile();
  const [rateLimit, setRateLimit] = useState(120);
  const [passwordPolicy, setPasswordPolicy] = useState("حداقل 6 کاراکتر + حرف + عدد");
  const canManage = roles.includes("admin");

  return (
    <ModulePage
      locale={locale}
      title="مدیریت سامانه | تنظیمات"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مدیریت سامانه" }, { label: "تنظیمات سیستم" }]}
      empty={false}
    >
      {!canManage ? (
        <Panel title="عدم دسترسی">
          <p className="text-sm text-muted-foreground">
            تنظیمات سامانه فقط برای نقش مدیر قابل ویرایش است.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {canManage ? (
          <Panel title="سیاست‌های امنیتی">
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-xs">محدودیت درخواست در دقیقه</label>
                <Input type="number" value={rateLimit} onChange={(e) => setRateLimit(Number(e.target.value))} />
              </div>
              <div>
                <label className="mb-1 block text-xs">سیاست رمز عبور (نسخه نمایشی)</label>
                <Input value={passwordPolicy} onChange={(e) => setPasswordPolicy(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Badge>جای‌نگهدار MFA</Badge>
                <Badge>RBAC فعال</Badge>
                <Badge>ممیزی فعال</Badge>
              </div>
              <Button>ذخیره تنظیمات (نسخه نمایشی)</Button>
            </div>
          </Panel>
        ) : null}

        <Panel title="پایش‌پذیری و سلامت سرویس">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>لاگ ساختاریافته همراه با `request_id`</li>
            <li>مسیر سلامت سرویس: `/health`</li>
            <li>مسیر آمادگی سرویس: `/ready`</li>
            <li>معماری آماده صف پردازش با Redis</li>
          </ul>
        </Panel>
      </div>
    </ModulePage>
  );
}
