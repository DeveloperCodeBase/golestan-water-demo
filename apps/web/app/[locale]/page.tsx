import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LocaleHome() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card/85 p-6 shadow-glass md:p-10">
        <p className="mb-2 text-xs font-semibold text-primary">معرفی سامانه</p>
        <h1 className="text-2xl font-black leading-relaxed md:text-4xl">تصمیم‌یار هوشمند رهاسازی آب سد گلستان</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          برای ورود و استفاده از داشبوردهای عملیاتی، پیش‌بینی، بهینه‌سازی و گزارش‌گیری، با حساب کاربری دمو وارد سامانه شوید.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login">
            <Button size="lg">ورود به سامانه</Button>
          </Link>
          <Link href="/fa/overview">
            <Button variant="outline" size="lg">مشاهده داشبورد (پس از ورود)</Button>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
        <p>
          این محصول با تمرکز روی تصمیم‌سازی علمی و بهره‌برداری عملیاتی توسعه یافته است: کیفیت‌سنجی داده، پیش‌بینی سناریومحور،
          برنامه‌ریزی رهاسازی با قیود ایمنی، پایش بحران، و گزارش قابل ارائه مدیریتی.
        </p>
        <p className="mt-2">
          پوشش نیازهای کلیدی RFP شامل تحلیل داده، بهینه‌سازی چندهدفه، سناریونگاری، مقایسه با روش سنتی، پشتیبانی بحران و آموزش
          بهره‌برداران در صفحات تخصصی سامانه پیاده‌سازی شده است.
        </p>
      </section>
    </div>
  );
}
