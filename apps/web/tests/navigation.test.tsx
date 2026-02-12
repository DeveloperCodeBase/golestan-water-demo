import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { AppShell } from "@/components/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fa/overview",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

describe("navigation", () => {
  it("renders primary menu links", () => {
    const { container } = render(
      <AppShell locale="fa">
        <div>content</div>
      </AppShell>
    );

    expect(screen.getAllByText("نمای کلی").length).toBeGreaterThan(0);
    expect(screen.getAllByText("پایش زنده").length).toBeGreaterThan(0);
    expect(screen.getByText("content")).toBeInTheDocument();
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("lg:flex-row-reverse");
  });
});
