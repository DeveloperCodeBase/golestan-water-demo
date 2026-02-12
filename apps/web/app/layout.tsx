import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "سامانه تصمیم‌یار رهاسازی آب گلستان",
  description: "داشبورد تصمیم‌یار مدیریت رهاسازی آب از سد گلستان به وشمگیر"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa-IR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
