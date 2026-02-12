"use client";

import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";

export default function HelpTrainingPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";

  return (
    <ModulePage
      locale={locale}
      title="راهنما و آموزش"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "راهنما و آموزش" }]}
      empty={false}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="راهنمای عملیات روزانه اپراتور">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>ابتدای شیفت: بررسی داشبورد نمای کلی (ذخیره، ریسک، هشدارها).</li>
            <li>پایش زنده: کنترل روند ورودی/خروجی و انحراف نسبت به روز قبل.</li>
            <li>پیش‌بینی: اجرای سناریوی مرجع (نرمال) و مقایسه با سناریوی خشک/تر.</li>
            <li>بهینه‌سازی: تعیین افق، وزن‌ها و قیود؛ سپس اجرای Run و بازبینی KPIها.</li>
            <li>بحران: اجرای موتور هشدار و تایید اقدامات پیشنهادی در صورت عبور از آستانه‌ها.</li>
            <li>گزارش: خروجی PDF/CSV برای جلسه بهره‌برداری یا کمیته بحران.</li>
          </ol>
        </Panel>

        <Panel title="چک‌لیست بهره‌برداری استاندارد">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>حداقل دبی محیط‌زیستی رعایت شده باشد.</li>
            <li>ذخیره پیش‌بینی‌شده از حد ایمن پایین‌تر نرود.</li>
            <li>برای شرایط سیلابی، ظرفیت تخلیه با قیود سازه‌ای هم‌راستا باشد.</li>
            <li>تامین شرب قبل از سایر مصارف تضمین شده باشد.</li>
            <li>تفاوت تصمیم مدل با روش سنتی مستندسازی شود.</li>
            <li>در پایان شیفت، Audit Log و هشدارهای باز بررسی شوند.</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="رویه استاندارد در شرایط خشکسالی">
          <p className="text-sm leading-7 text-muted-foreground">
            تمرکز روی کاهش ریسک کمبود: افزایش وزن شرب و محیط‌زیست، کاهش سهم کشاورزی کوتاه‌مدت، کنترل افت ذخیره و اجرای سناریوهای
            حساسیت با ضریب ورودی پایین.
          </p>
        </Panel>
        <Panel title="رویه استاندارد در شرایط سیلاب">
          <p className="text-sm leading-7 text-muted-foreground">
            تمرکز روی کاهش ریسک سرریز: بازبینی سقف رهاسازی ایمن، پیش‌تخلیه کنترل‌شده، و پایش ساعتی ورودی‌ها در بازه‌های بارش شدید.
          </p>
        </Panel>
        <Panel title="تعاریف شاخص‌ها">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Reliability: نسبت دوره‌های تامین کامل.</li>
            <li>Vulnerability: شدت پیامد در حالت کمبود.</li>
            <li>Resilience: سرعت بازگشت به وضعیت پایدار.</li>
            <li>Risk Index: ترکیب وزنی ریسک خشکسالی/سیلاب.</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="سوالات متداول">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>اگر داده ناقص باشد چه می‌شود؟ سامانه در بخش کیفیت داده پرچم مشکوک/ناقص می‌زند.</li>
            <li>چرا Run جدید با Run قبلی متفاوت است؟ به‌دلیل تغییر سناریو، وزن‌ها یا قیود.</li>
            <li>چه زمانی خروجی قابل اتکا است؟ وقتی ورودی‌های داده کیفیت مناسب داشته باشند و هشدار بحرانی فعال نباشد.</li>
          </ul>
        </Panel>
        <Panel title="آموزش تکمیلی">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>ویدئو آموزشی: `assets/training/operator-overview.mp4` (جای‌نگهدار)</li>
            <li>راهنمای فنی مدل‌ها: `assets/training/model-guide.pdf` (جای‌نگهدار)</li>
            <li>فرم ثبت Incident: `assets/training/incident-template.docx` (جای‌نگهدار)</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="برنامه آموزشی پیشنهادی بهره‌برداران">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>جلسه ۱ (۹۰ دقیقه): آشنایی با داده‌ها، سنجه‌های کیفیت و مدیریت دسترسی‌ها.</li>
            <li>جلسه ۲ (۹۰ دقیقه): پیش‌بینی، بک‌تست، تفسیر عدم‌قطعیت و رجیستری مدل.</li>
            <li>جلسه ۳ (۱۲۰ دقیقه): اجرای بهینه‌سازی، سناریوسازی، مدیریت بحران و گزارش‌گیری.</li>
            <li>ارزیابی نهایی: اجرای یک سناریوی خشک و یک سناریوی سیلابی با گزارش مدیریتی.</li>
          </ol>
        </Panel>
        <Panel title="چک‌لیست تحویل شیفت">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>آخرین اجرای بهینه‌سازی به همراه پارامترها ثبت شده باشد.</li>
            <li>هشدارهای باز، وضعیت رسیدگی و اقدام پیشنهادی ثبت شده باشد.</li>
            <li>تغییرات کاربران/نقش‌ها در گزارش ممیزی کنترل شده باشد.</li>
            <li>گزارش خلاصه شیفت در قالب PDF ذخیره و آرشیو شده باشد.</li>
          </ul>
        </Panel>
      </div>
    </ModulePage>
  );
}
