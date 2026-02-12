"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[92vw] max-w-sm border-r border-border bg-card p-4 shadow-glass",
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
