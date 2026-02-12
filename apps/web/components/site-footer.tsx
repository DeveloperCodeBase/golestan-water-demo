export function SiteFooter() {
  return (
    <footer className="border-t bg-card/70 px-4 py-4 text-center text-xs text-muted-foreground">
      <p className="font-semibold text-foreground">
        کلیه حقوق مادی و معنوی این سامانه برای شرکت شبکه هوشمند ابتکار ویستا محفوظ است. © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
