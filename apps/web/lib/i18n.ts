export type Locale = "fa" | "en";

export const supportedLocales: Locale[] = ["fa", "en"];

export const labels = {
  fa: {
    appTitle: "سامانه تصمیم‌یار رهاسازی آب",
    subtitle: "سد گلستان ← سد وشمگیر",
    overview: "نمای کلی",
    liveMonitoring: "پایش زنده",
    dataManagement: "مدیریت داده",
    forecasting: "پیش‌بینی",
    optimization: "برنامه‌ریز بهینه‌سازی",
    scenarioLab: "آزمایشگاه سناریو",
    crisisCenter: "مرکز بحران",
    reports: "گزارش‌ها",
    admin: "مدیریت سیستم",
    help: "راهنما و آموزش",
    export: "خروجی",
    share: "اشتراک",
    filters: "فیلترها",
    dateRange: "بازه زمانی",
    loading: "در حال بارگذاری...",
    empty: "داده‌ای برای نمایش وجود ندارد",
    error: "خطا در دریافت داده",
    login: "ورود"
  },
  en: {
    appTitle: "Water Release Decision Support",
    subtitle: "Golestan → Voshmgir",
    overview: "Overview",
    liveMonitoring: "Live Monitoring",
    dataManagement: "Data Management",
    forecasting: "Forecasting",
    optimization: "Optimization Planner",
    scenarioLab: "Scenario Lab",
    crisisCenter: "Crisis Center",
    reports: "Reports",
    admin: "Admin",
    help: "Help & Training",
    export: "Export",
    share: "Share",
    filters: "Filters",
    dateRange: "Date Range",
    loading: "Loading...",
    empty: "No data available",
    error: "Failed to load data",
    login: "Login"
  }
} as const;

export function getLocale(locale: string | undefined): Locale {
  return locale === "en" ? "en" : "fa";
}
