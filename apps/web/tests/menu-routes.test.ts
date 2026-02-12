import { existsSync } from "node:fs";
import path from "node:path";

import { flattenNavItems, mobileNav, navGroups } from "@/lib/menu";

function routeFile(href: string) {
  const trimmed = href.replace(/^\/+/, "");
  return path.join(process.cwd(), "app", "[locale]", trimmed, "page.tsx");
}

describe("menu routes", () => {
  it("all sidebar routes point to implemented pages", () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        expect(existsSync(routeFile(item.href))).toBe(true);
      }
    }
  });

  it("all mobile routes are included in sidebar definitions", () => {
    const hrefs = new Set(flattenNavItems().map((item) => item.href));
    for (const item of mobileNav) {
      expect(hrefs.has(item.href)).toBe(true);
    }
  });
});

