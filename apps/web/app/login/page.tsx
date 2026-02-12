"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiBaseUrl, saveAuthTokens } from "@/lib/api-client";

const demoUsers = [
  { username: "admin", password: "admin123", role: "مدیر سامانه" },
  { username: "operator", password: "op123", role: "اپراتور" },
  { username: "analyst", password: "an123", role: "تحلیل‌گر" },
  { username: "viewer", password: "vi123", role: "ناظر" },
  { username: "auditor", password: "au123", role: "ممیز" }
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/fa/overview");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/")) {
      setNextPath(next);
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        throw new Error("auth_failed");
      }
      const json = await response.json();
      saveAuthTokens(json.data.access_token, json.data.refresh_token, json.data.user);
      router.push(nextPath);
    } catch {
      setError("نام کاربری یا رمز عبور نامعتبر است.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-120px] top-[-90px] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-100px] h-80 w-80 rounded-full bg-success/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 lg:py-12">
        <div className="w-full space-y-5">
          <section className="mx-auto flex w-full max-w-3xl items-center justify-center">
            <div className="flex w-full items-center gap-3 rounded-2xl border bg-card/90 px-4 py-3 shadow-glass backdrop-blur sm:w-auto">
              <Image
                src="/company-logo.svg"
                alt="لوگوی شرکت شبکه هوشمند ابتکار ویستا"
                width={56}
                height={56}
                className="h-12 w-12 shrink-0 object-contain"
                priority
              />
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">ورود به سامانه تصمیم‌یار مدیریت رهاسازی آب</p>
                <p className="text-sm font-extrabold">شرکت شبکه هوشمند ابتکار ویستا</p>
              </div>
            </div>
          </section>

          <div className="grid w-full gap-6 lg:grid-cols-2">
            <section className="hidden rounded-2xl border bg-card/85 p-6 shadow-glass lg:block">
              <p className="mb-2 text-xs font-semibold text-primary">دسترسی ایمن و حرفه‌ای</p>
              <h1 className="text-2xl font-black leading-relaxed">پنل تصمیم‌یار رهاسازی آب سد گلستان به وشمگیر</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                پس از ورود، به ماژول‌های پایش زنده، مدیریت داده، پیش‌بینی سناریومحور، بهینه‌سازی چندهدفه، بحران، گزارش و ممیزی
                دسترسی خواهید داشت.
              </p>

              <div className="mt-5 space-y-2">
                {demoUsers.map((user) => (
                  <div key={user.username} className="rounded-lg border bg-background/70 p-2 text-xs">
                    <p className="font-semibold">{user.role}</p>
                    <p className="text-muted-foreground">{user.username} / {user.password}</p>
                  </div>
                ))}
              </div>
            </section>

            <Card className="w-full border-primary/25 shadow-glass">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 lg:hidden">
                  <Image
                    src="/company-logo.svg"
                    alt="لوگوی شرکت شبکه هوشمند ابتکار ویستا"
                    width={42}
                    height={42}
                    className="h-10 w-10 shrink-0 object-contain"
                  />
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">شبکه هوشمند ابتکار ویستا</p>
                    <p className="text-xs font-bold">سامانه تصمیم‌یار مدیریت آب</p>
                  </div>
                </div>
                <CardTitle>ورود به پنل عملیاتی</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={onSubmit}>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="نام کاربری" />
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" type="password" />
                  {error ? <p className="text-xs text-danger">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "در حال ورود..." : "ورود"}
                  </Button>
                </form>

                <div className="mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground lg:hidden">
                  <p className="mb-1 font-semibold">کاربران دمو</p>
                  {demoUsers.map((user) => (
                    <p key={user.username}>{user.username} / {user.password}</p>
                  ))}
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <Link href="/" className="text-primary underline">
                    بازگشت به صفحه معرفی
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
