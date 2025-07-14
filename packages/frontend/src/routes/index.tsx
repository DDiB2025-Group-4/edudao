import { createFileRoute } from "@tanstack/react-router";
import { ConstructionIcon } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { WrappedConnectButton } from "@/components/ConectButton";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const account = useAccount();

  return (
    <div className="px-4 sm:px-8 py-8 ">
      <div className="py-8 sm:py-16">
        <h1 className="text-4xl font-bold">EduDAO</h1>
        <div className="text-lg text-muted-foreground mt-2">
          Decentralized platform that transforms how academic certificates are issued, verified, and governed using
          blockchain technology.
        </div>
      </div>

      {account.isConnected ? (
        <div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Connect your wallet to access the platform</CardDescription>
            </CardHeader>
            <CardFooter>
              <WrappedConnectButton className="w-full" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Learn EduDAO</CardTitle>
              <CardDescription>Learn EduDAO from Whitepaper</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <ConstructionIcon />
                TODO
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
