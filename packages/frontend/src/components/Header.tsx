import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { WrappedConnectButton } from "./ConectButton";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="bg-background">
      <div className="container mx-auto flex w-full justify-between gap-2 p-4">
        <Link to="/">
          <h1 className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="w-4-h-4" />
            EduDAO
          </h1>
        </Link>
        <div className="flex gap-2">
          <nav className="hidden items-center sm:flex">
            <Button variant="ghost" asChild>
              <Link to="/issuer">Issuer</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/holder">Holder</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Verifier</Link>
            </Button>
          </nav>
          <WrappedConnectButton />
        </div>
      </div>
    </header>
  );
}
