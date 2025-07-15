export const Footer = () => {
  return (
    <footer className="border-border border-t bg-background">
      <div className="container mx-auto flex w-full justify-between gap-2 p-4">
        <div className="text-muted-foreground text-sm">© {new Date().getFullYear()} EduDAO. All rights reserved.</div>
        <nav className="flex gap-2">
          <a href="/privacy" className="text-muted-foreground text-sm hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="text-muted-foreground text-sm hover:underline">
            Terms of Service
          </a>
        </nav>
      </div>
    </footer>
  );
};
