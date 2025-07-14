export const Footer = () => {
  return (
    <footer className="bg-background ">
      <div className="w-full container mx-auto flex justify-between gap-2 p-4">
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} EduDAO. All rights reserved.</div>
        <nav className="flex gap-2">
          <a href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms of Service
          </a>
        </nav>
      </div>
    </footer>
  );
};
