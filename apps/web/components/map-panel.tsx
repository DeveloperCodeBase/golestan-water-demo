export function MapPanel() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className="mb-1 text-sm font-semibold">پنل GIS منطقه سدها (نسخه نمایشی)</p>
      <p className="mb-3 text-xs text-muted-foreground">نمای شماتیک موقعیت سد گلستان، سد وشمگیر، ایستگاه‌ها و گره‌های پایین‌دست</p>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="relative h-64 overflow-hidden rounded-lg border bg-gradient-to-br from-cyan-50 via-slate-100 to-emerald-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-700 sm:h-72">
          <svg className="h-full w-full" viewBox="0 0 1000 520" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(51,65,85,0.18)" strokeWidth="1" />
              </pattern>
              <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>

            <rect width="1000" height="520" fill="url(#grid)" />
            <path d="M45,420 L170,260 L300,240 L420,290 L390,480 L120,500 Z" fill="rgba(34,197,94,0.18)" />
            <path d="M570,70 L880,60 L945,260 L780,360 L615,250 Z" fill="rgba(14,165,233,0.16)" />
            <path
              d="M160,70 C280,130 350,140 460,220 C520,260 620,290 760,410"
              fill="none"
              stroke="url(#river)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="220" cy="95" r="11" fill="#0f766e" />
            <circle cx="520" cy="245" r="10" fill="#1d4ed8" />
            <circle cx="660" cy="320" r="9" fill="#2563eb" />
            <circle cx="760" cy="410" r="10" fill="#f59e0b" />
          </svg>

          <span className="absolute right-[24%] top-[24%] inline-flex h-4 w-4 animate-ping rounded-full bg-primary/60" />
          <span className="absolute left-[46%] top-[47%] inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-blue-600/60" />
          <span className="absolute left-[33%] top-[61%] inline-flex h-3 w-3 animate-ping rounded-full bg-sky-600/60" />

          <div className="absolute right-[18%] top-[18%] rounded-full bg-primary px-2 py-1 text-[11px] text-primary-foreground">
            سد گلستان
          </div>
          <div className="absolute left-[41%] top-[43%] rounded-full bg-blue-700 px-2 py-1 text-[11px] text-white">
            سد وشمگیر
          </div>
          <div className="absolute left-[28%] top-[56%] rounded-full bg-sky-600 px-2 py-1 text-[11px] text-white">
            ایستگاه رودخانه
          </div>
          <div className="absolute left-[18%] bottom-[15%] rounded-full bg-amber-600 px-2 py-1 text-[11px] text-white">
            گره کشاورزی/شرب
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="rounded-lg border p-2">
            <p className="font-semibold">لایه‌ها</p>
            <p className="mt-1 text-muted-foreground">رودخانه اصلی، مخازن، ایستگاه‌های اندازه‌گیری، گره‌های تخصیص</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <span className="rounded bg-emerald-200/50 px-1 py-0.5 text-center">ناحیه کشاورزی</span>
              <span className="rounded bg-sky-200/50 px-1 py-0.5 text-center">ناحیه سیلابی</span>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <p className="font-semibold">مختصات نمونه</p>
            <p className="mt-1 text-muted-foreground">سد گلستان: 37.2N, 55.5E</p>
            <p className="text-muted-foreground">سد وشمگیر: 37.4N, 55.9E</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="font-semibold">وضعیت آنلاین</p>
            <p className="mt-1 text-success">اتصال سنجش‌ها: پایدار</p>
            <p className="text-warning">ریسک پایین‌دست: متوسط</p>
          </div>
        </div>
      </div>
    </div>
  );
}
