import * as React from "react";

import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/40",
        props.className
      )}
    />
  );
}
