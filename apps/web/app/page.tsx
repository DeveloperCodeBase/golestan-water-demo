import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const features = [
  "مدیریت یکپارچه داده‌های هیدرولوژی، هواشناسی و بهره‌برداری پایین‌دست",
  "پیش‌بینی ورودی/تقاضا/وضعیت مخزن با عدم‌قطعیت و بک‌تست",
  "بهینه‌سازی چندهدفه برنامه رهاسازی با قیود ایمنی و محیط‌زیست",
  "پشتیبانی تصمیم بحران (خشکسالی/سیلاب) و هشدارهای قاعده‌محور",
  "گزارش‌های مدیریتی و فنی قابل خروجی پی‌دی‌اف/سی‌اس‌وی"
];

export default function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:py-16">
        <div className="rounded-3xl border bg-card/80 p-6 shadow-glass backdrop-blur md:p-10">
          <p className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            نسخه دمو سازمانی | گلستان ← وشمگیر
          </p>
          <h1 className="mb-4 text-2xl font-black leading-relaxed md:text-4xl">
            سامانه تصمیم‌یار مدیریت رهاسازی آب از سد
            <span className="block text-primary">گلستان به وشمگیر</span>
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            این دمو با معماری Full-Stack + ML/MLOps طراحی شده و برای نمایش فرآیند تصمیم‌سازی حرفه‌ای در مدیریت منابع آب
            در شرایط نرمال، خشکسالی و سیلاب آماده است.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg">ورود به سامانه</Button>
            </Link>
            <Link href="/fa">
              <Button variant="outline" size="lg">مشاهده معرفی فارسی</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article key={feature} className="rounded-xl border bg-card/75 p-4 shadow-soft">
              <h2 className="text-sm font-semibold">قابلیت کلیدی</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border bg-card/80 p-5 shadow-soft md:p-8">
          <h2 className="text-lg font-black md:text-2xl">معرفی تخصصی پروژه</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            این سامانه برای تصمیم‌سازی عملیاتی در رهاسازی آب سد گلستان به وشمگیر طراحی شده و جریان کامل Data → Forecast →
            Optimization → Crisis را پوشش می‌دهد. در لایه پیش‌بینی، تحلیل ورودی، تقاضا و وضعیت مخزن به‌صورت سناریومحور انجام
            می‌شود؛ در لایه بهینه‌سازی، قیود ایمنی، حداقل دبی محیط‌زیستی و اولویت تامین بخش‌ها همزمان لحاظ می‌گردد.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            ساختار فنی سامانه شامل داشبورد RTL ریسپانسیو، API استاندارد، RBAC، مسیر ممیزی، Seed داده ۵ ساله، گزارش‌گیری مدیریتی،
            و دستیار چت تخصصی است تا امکان ارائه حرفه‌ای، آموزش بهره‌برداران و توسعه عملیاتی در فازهای بعدی را فراهم کند.
          </p>
        </section>
      </section>
      <SiteFooter />
    </div>
  );
}
