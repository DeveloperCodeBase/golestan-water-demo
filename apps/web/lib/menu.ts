import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Cog,
  Database,
  Gauge,
  LayoutDashboard,
  LineChart,
  Radio,
  Shield,
  Users,
  WandSparkles
} from "lucide-react";

export type SubNavItem = {
  id: string;
  labelFa: string;
  labelEn: string;
  href: string;
};

export type NavGroup = {
  id: string;
  labelFa: string;
  labelEn: string;
  icon: ComponentType<{ className?: string }>;
  items: SubNavItem[];
};

export const navGroups: NavGroup[] = [
  {
    id: "overview",
    labelFa: "نمای کلی",
    labelEn: "Overview",
    icon: LayoutDashboard,
    items: [{ id: "overview", labelFa: "داشبورد", labelEn: "Dashboard", href: "/overview" }]
  },
  {
    id: "live-monitoring",
    labelFa: "پایش زنده",
    labelEn: "Live Monitoring",
    icon: Radio,
    items: [
      { id: "reservoir-gates", labelFa: "مخزن و دریچه‌ها", labelEn: "Reservoir & Gates", href: "/live-monitoring/reservoir-gates" },
      { id: "inflow-outflow", labelFa: "ورودی و خروجی", labelEn: "Inflow/Outflow", href: "/live-monitoring/inflow-outflow" }
    ]
  },
  {
    id: "data-management",
    labelFa: "مدیریت داده",
    labelEn: "Data Management",
    icon: Database,
    items: [
      { id: "datasets", labelFa: "مجموعه‌داده‌ها", labelEn: "Datasets", href: "/data-management/datasets" },
      { id: "data-quality", labelFa: "کیفیت داده", labelEn: "Data Quality", href: "/data-management/data-quality" },
      { id: "imports", labelFa: "ورود داده", labelEn: "Imports", href: "/data-management/imports" }
    ]
  },
  {
    id: "forecasting",
    labelFa: "مرکز پیش‌بینی",
    labelEn: "Forecasting Center",
    icon: LineChart,
    items: [
      { id: "forecast-inflow", labelFa: "پیش‌بینی ورودی", labelEn: "Inflow", href: "/forecasting/inflow" },
      { id: "forecast-demand", labelFa: "پیش‌بینی تقاضا", labelEn: "Demand", href: "/forecasting/demand-by-sector" },
      { id: "forecast-models", labelFa: "رجیستری مدل‌ها", labelEn: "Models", href: "/forecasting/models" }
    ]
  },
  {
    id: "optimization",
    labelFa: "برنامه‌ریز بهینه‌سازی",
    labelEn: "Optimization Planner",
    icon: WandSparkles,
    items: [
      { id: "new-run", labelFa: "اجرای جدید (گام‌به‌گام)", labelEn: "New Run", href: "/optimization/new-run" },
      { id: "runs-history", labelFa: "تاریخچه اجراها", labelEn: "Runs History", href: "/optimization/runs-history" },
      { id: "release-plans", labelFa: "برنامه‌های رهاسازی", labelEn: "Release Plans", href: "/optimization/release-plans" }
    ]
  },
  {
    id: "scenario-lab",
    labelFa: "آزمایشگاه سناریو",
    labelEn: "Scenario Lab",
    icon: Activity,
    items: [{ id: "scenario-lab", labelFa: "تحلیل چه-می‌شود-اگر", labelEn: "What-if", href: "/scenario-lab" }]
  },
  {
    id: "crisis-center",
    labelFa: "مرکز بحران",
    labelEn: "Crisis Center",
    icon: AlertTriangle,
    items: [{ id: "crisis-center", labelFa: "خشکسالی و سیلاب", labelEn: "Flood/Drought", href: "/crisis-center" }]
  },
  {
    id: "reports",
    labelFa: "گزارش‌ها",
    labelEn: "Reports",
    icon: Gauge,
    items: [{ id: "reports", labelFa: "گزارش مدیریتی و فنی", labelEn: "Reports", href: "/reports" }]
  },
  {
    id: "admin",
    labelFa: "مدیریت سامانه",
    labelEn: "Admin",
    icon: Users,
    items: [
      { id: "users-roles", labelFa: "کاربران و نقش‌ها", labelEn: "Users & Roles", href: "/admin/users-roles" },
      { id: "audit-logs", labelFa: "گزارش ممیزی", labelEn: "Audit Logs", href: "/admin/audit-logs" },
      { id: "system-settings", labelFa: "تنظیمات سیستم", labelEn: "System Settings", href: "/admin/system-settings" }
    ]
  },
  {
    id: "help",
    labelFa: "راهنما و آموزش",
    labelEn: "Help & Training",
    icon: BookOpen,
    items: [{ id: "help-training", labelFa: "آموزش بهره‌بردار", labelEn: "Help", href: "/help-training" }]
  }
];

export const mobileNav = [
  { labelFa: "داشبورد", labelEn: "Overview", href: "/overview", icon: LayoutDashboard },
  { labelFa: "پایش", labelEn: "Live", href: "/live-monitoring/reservoir-gates", icon: Radio },
  { labelFa: "پیش‌بینی", labelEn: "Forecast", href: "/forecasting/inflow", icon: BarChart3 },
  { labelFa: "بهینه‌سازی", labelEn: "Optimize", href: "/optimization/new-run", icon: WandSparkles },
  { labelFa: "بحران", labelEn: "Crisis", href: "/crisis-center", icon: AlertTriangle }
];

export function flattenNavItems() {
  return navGroups.flatMap((group) => group.items);
}

export const systemFooterLinks = [
  { labelFa: "تنظیمات", labelEn: "Settings", href: "/admin/system-settings", icon: Cog },
  { labelFa: "حریم و ممیزی", labelEn: "Audit", href: "/admin/audit-logs", icon: Shield }
];
