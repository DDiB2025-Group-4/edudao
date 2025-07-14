import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { WrappedConnectButton } from "./ConectButton";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="bg-background">
      <div className="w-full max-w-3xl mx-auto flex justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <GraduationCap />
          <h1 className="text-xl font-bold">EduDAO</h1>
        </div>
        <div className="flex gap-2">
          <nav className="items-center hidden sm:flex">
            <Button variant="ghost" asChild>
              <Link to="/">Issuer</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Holder</Link>
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
