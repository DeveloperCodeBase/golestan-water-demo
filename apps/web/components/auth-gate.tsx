"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingState } from "@/components/states";
import { TOKEN_KEY } from "@/lib/api-client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const path = pathname ?? "";
    const segments = path.split("/").filter(Boolean);
    const isLocaleRoot = segments.length === 1 && (segments[0] === "fa" || segments[0] === "en");

    if (isLocaleRoot) {
      setAllowed(true);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      const next = encodeURIComponent(path || "/fa/overview");
      router.replace(`/login?next=${next}`);
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) {
    return <LoadingState label="در حال بررسی دسترسی کاربر..." />;
  }

  return <>{children}</>;
}
