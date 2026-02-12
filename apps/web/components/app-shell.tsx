"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

import { ChatbotPopup } from "@/components/chatbot-popup";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { clearAuthTokens, useAuthProfile } from "@/lib/api-client";
import { navGroups, systemFooterLinks } from "@/lib/menu";
import { cn } from "@/lib/utils";

type Props = {
  locale: "fa" | "en";
  children: ReactNode;
};

function label(_locale: "fa" | "en", text: { labelFa: string; labelEn: string }) {
  return text.labelFa;
}

function NavLink({ href, text, active }: { href: string; text: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-xs transition",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/30"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      {text}
    </Link>
  );
}

export function AppShell({ locale, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { roles, token, ready } = useAuthProfile();

  const canAccess = (href: string) => {
    if (!ready) return !href.startsWith("/admin");
    if (token && !roles.length) return !href.startsWith("/admin");
    if (!roles.length) return true;
    if (href === "/admin/users-roles" || href === "/admin/system-settings") {
      return roles.includes("admin");
    }
    if (href === "/admin/audit-logs") {
      return roles.includes("admin") || roles.includes("auditor");
    }
    return true;
  };

  const visibleGroups = useMemo(() => {
    return navGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => canAccess(item.href)) }))
      .filter((group) => group.items.length > 0);
  }, [roles]);

  const visibleFooterLinks = useMemo(() => systemFooterLinks.filter((item) => canAccess(item.href)), [roles]);

  const onLogout = () => {
    clearAuthTokens();
    router.push("/login");
  };

  return (
    <div className={cn("min-h-screen", locale === "fa" ? "xl:flex xl:flex-row-reverse" : "xl:flex")}>
      <aside className="hidden xl:flex xl:h-screen xl:w-[340px] xl:flex-col xl:border-l xl:bg-card/90 xl:backdrop-blur">
        <div className="border-b p-4">
          <p className="text-sm font-bold">سامانه تصمیم‌یار مدیریت رهاسازی آب</p>
          <p className="mt-1 text-xs text-muted-foreground">سد گلستان ← سد وشمگیر</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {visibleGroups.map((group) => {
            const groupActive = group.items.some((item) => pathname === `/${locale}${item.href}` || pathname?.startsWith(`/${locale}${item.href}/`));
            const GroupIcon = group.icon;

            return (
              <section key={group.id} className={cn("rounded-xl border p-2", groupActive ? "border-primary/40 bg-primary/5" : "")}> 
                <div className="mb-2 flex items-center gap-2 px-2 text-sm font-semibold">
                  <GroupIcon className="h-4 w-4" />
                  <span>{label(locale, group)}</span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const href = `/${locale}${item.href}`;
                    const active = pathname === href || pathname?.startsWith(`${href}/`);
                    return <NavLink key={item.id} href={href} text={label(locale, item)} active={active} />;
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="border-t p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            {visibleFooterLinks.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className="flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                <item.icon className="h-3.5 w-3.5" />
                {label(locale, item)}
              </Link>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={onLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            خروج از حساب
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 border-b bg-card/95 px-3 py-2 backdrop-blur xl:hidden">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between">
            <Button variant="outline" size="sm" className="bg-card" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
              <span className="mr-2">منو</span>
            </Button>
            <p className="text-xs font-bold">سامانه تصمیم‌یار مدیریت رهاسازی آب</p>
          </div>
        </header>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="right-0 left-auto w-[92vw] max-w-sm border-l border-r-0">
            <DialogTitle className="mb-3 text-sm">منوی سامانه</DialogTitle>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">
              {visibleGroups.map((group) => (
                <section key={group.id} className="rounded-lg border p-2">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">{label(locale, group)}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/${locale}${item.href}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        {label(locale, item)}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              خروج از حساب
            </Button>
          </DialogContent>
        </Dialog>

        <main className="mx-auto max-w-[1700px] p-3 sm:p-4 lg:p-5">{children}</main>
        <SiteFooter />
      </div>

      <ChatbotPopup />
    </div>
  );
}
