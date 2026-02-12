export function SiteFooter() {
  return (
    <footer className="border-t bg-card/70 px-4 py-4 text-center text-xs text-muted-foreground">
      <p className="font-semibold text-foreground">کلیه حقوق مادی و معنوی این سامانه محفوظ است.</p>
      <p className="mt-1">هرگونه بازنشر، بهره‌برداری یا کپی‌برداری بدون مجوز کتبی ممنوع است. © {new Date().getFullYear()}</p>
    </footer>
  );
}
