export function SiteFooter() {
  return (
    <footer className="border-t bg-card/70 px-4 py-4 text-center text-xs text-muted-foreground">
      <p className="font-semibold text-foreground">حقوق مادی و معنوی سامانه متعلق به شبکه هوشمند ابتکار ویستا است.</p>
      <p className="mt-1">هرگونه بهره‌برداری، بازنشر یا کپی‌برداری بدون مجوز کتبی ممنوع است. © {new Date().getFullYear()}</p>
    </footer>
  );
}
