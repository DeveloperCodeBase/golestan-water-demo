export function MapPanel() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className="mb-1 text-sm font-semibold">پنل GIS منطقه‌ای سدها (توپوگرافی نمایشی)</p>
      <p className="mb-3 text-xs text-muted-foreground">
        نمایش توپوگرافی/شبکه رودخانه‌ای برای کریدور گلستان → وشمگیر با نقاط کلیدی بهره‌برداری و پایش
      </p>

      <div className="grid gap-4 xl:grid-cols-[3fr_1.2fr]">
        <div className="relative h-[320px] overflow-hidden rounded-lg border bg-gradient-to-br from-emerald-50 via-cyan-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 sm:h-[420px]">
          <svg className="h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="none">
            <defs>
              <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#def7ec" />
                <stop offset="28%" stopColor="#d1fae5" />
                <stop offset="52%" stopColor="#e9f9ee" />
                <stop offset="75%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </linearGradient>
              <linearGradient id="reliefHigh" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(120,53,15,0.2)" />
                <stop offset="100%" stopColor="rgba(120,53,15,0.03)" />
              </linearGradient>
              <linearGradient id="mainRiver" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <pattern id="contourPattern" width="120" height="70" patternUnits="userSpaceOnUse">
                <path d="M0,50 C20,38 40,62 60,50 C80,38 100,62 120,50" fill="none" stroke="rgba(120,113,108,0.22)" strokeWidth="1" />
              </pattern>
            </defs>

            <rect width="1200" height="700" fill="url(#terrain)" />
            <rect width="1200" height="700" fill="url(#contourPattern)" opacity="0.85" />

            <path d="M40,570 C170,460 230,470 350,410 C470,350 560,255 660,220 C760,185 930,190 1140,120 L1200,80 L1200,700 L0,700 Z" fill="url(#reliefHigh)" />
            <path d="M15,625 C130,545 240,525 370,470 C520,408 630,332 760,300 C860,275 980,282 1190,228" fill="none" stroke="rgba(146,64,14,0.2)" strokeWidth="2" />
            <path d="M0,520 C165,440 285,430 420,358 C545,292 645,220 780,192 C920,160 1050,170 1200,120" fill="none" stroke="rgba(146,64,14,0.17)" strokeWidth="2" />
            <path d="M0,455 C170,382 295,355 450,300 C590,250 700,200 840,175 C960,152 1080,156 1200,121" fill="none" stroke="rgba(120,53,15,0.13)" strokeWidth="1.8" />

            <path d="M220,120 C330,178 428,228 525,308 C645,405 770,454 1020,610" fill="none" stroke="url(#mainRiver)" strokeWidth="16" strokeLinecap="round" />
            <path d="M455,230 C510,270 552,320 610,378" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
            <path d="M760,430 C720,405 672,378 636,345" fill="none" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />

            <path d="M513,290 C546,286 582,302 598,332 C608,351 598,382 569,392 C538,403 507,382 501,352 C497,330 504,305 513,290 Z" fill="#1d4ed8" opacity="0.9" />
            <path d="M315,176 C342,168 372,179 382,198 C392,218 387,248 362,260 C332,273 303,255 296,232 C289,208 296,183 315,176 Z" fill="#0f766e" opacity="0.92" />

            <circle cx="340" cy="220" r="9.5" fill="#065f46" />
            <circle cx="550" cy="340" r="9.5" fill="#1d4ed8" />
            <circle cx="690" cy="430" r="8.5" fill="#0284c7" />
            <circle cx="915" cy="558" r="9.5" fill="#d97706" />
          </svg>

          <span className="absolute right-[34%] top-[41%] inline-flex h-4 w-4 animate-ping rounded-full bg-emerald-600/70" />
          <span className="absolute right-[52%] top-[53%] inline-flex h-4 w-4 animate-ping rounded-full bg-blue-700/70" />
          <span className="absolute left-[39%] top-[62%] inline-flex h-3 w-3 animate-ping rounded-full bg-sky-600/70" />

          <div className="absolute right-[29%] top-[35%] rounded-full bg-emerald-700 px-2 py-1 text-[11px] text-white">سد گلستان</div>
          <div className="absolute right-[47%] top-[47%] rounded-full bg-blue-700 px-2 py-1 text-[11px] text-white">سد وشمگیر</div>
          <div className="absolute left-[35%] top-[58%] rounded-full bg-sky-600 px-2 py-1 text-[11px] text-white">ایستگاه سنجش دبی</div>
          <div className="absolute left-[17%] bottom-[14%] rounded-full bg-amber-600 px-2 py-1 text-[11px] text-white">گره پایین‌دست</div>

          <div className="absolute left-3 top-3 rounded-md border bg-card/90 px-2 py-1 text-[11px] text-muted-foreground">
            مقیاس نمایشی: 1:250,000 | CRS: WGS84
          </div>
          <div className="absolute bottom-3 right-3 rounded-md border bg-card/90 px-2 py-1 text-[11px] text-muted-foreground">
            جهت شمال ↑
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="rounded-lg border p-2.5">
            <p className="font-semibold">لایه‌های فعال</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>توپوگرافی و خطوط هم‌ارتفاع</li>
              <li>رودخانه اصلی و شاخه‌های فرعی</li>
              <li>محدوده مخازن و گره‌های پایین‌دست</li>
              <li>ایستگاه‌های سنجش دبی/هواشناسی</li>
            </ul>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="font-semibold">مختصات کلیدی</p>
            <p className="mt-1 text-muted-foreground">سد گلستان: 37.21N, 55.54E</p>
            <p className="text-muted-foreground">سد وشمگیر: 37.42N, 55.98E</p>
            <p className="text-muted-foreground">گره زراعی پایین‌دست: 37.57N, 56.18E</p>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="font-semibold">شاخص آنلاین GIS</p>
            <p className="mt-1 text-success">همگام‌سازی لایه‌ها: پایدار</p>
            <p className="text-muted-foreground">به‌روزرسانی آخر: ۵ دقیقه قبل</p>
            <p className="text-warning">ریسک شبکه پایین‌دست: متوسط</p>
          </div>
        </div>
      </div>
    </div>
  );
}
