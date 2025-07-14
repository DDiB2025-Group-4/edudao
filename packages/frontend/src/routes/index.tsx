import { createFileRoute, Link } from "@tanstack/react-router";
import { Building, ConstructionIcon, GraduationCap, School } from "lucide-react";
import { useAccount } from "wagmi";
import { WrappedConnectButton } from "@/components/ConectButton";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnEduNfts } from "@/hooks/thirdweb";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const account = useAccount();

  const query = useOwnEduNfts(account);

  console.log("Own Edu NFTs:", query.data);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="py-8 sm:py-16">
        <h1 className="font-bold text-4xl">EduDAO</h1>
        <div className="mt-2 text-lg text-muted-foreground">
          Decentralized platform that transforms how academic certificates are issued, verified, and governed using
          blockchain technology.
        </div>
      </div>

      {account.isConnected ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-fit rounded-full p-3">
                  <School className="h-8 w-8 " />
                </div>
                <CardTitle>Issuer</CardTitle>
                <CardDescription>University or Educational Institution</CardDescription>
              </CardHeader>
              <div className="px-6 pb-4">
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>1. Issue graduation certificates</li>
                  <li>2. Create verifiable credentials</li>
                  <li>3. DAO governance integration</li>
                </ul>
              </div>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/">Continue as Issuer</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-fit rounded-full p-3">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <CardTitle>Holder</CardTitle>
                <CardDescription>Graduate or Student</CardDescription>
              </CardHeader>
              <div className="px-6 pb-4">
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>1. Manage your credentials</li>
                  <li>2. Control privacy settings</li>
                  <li>3. Generate verification QR codes</li>
                </ul>
              </div>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/">Continue as Holder</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-fit rounded-full p-3">
                  <Building className="h-8 w-8" />
                </div>
                <CardTitle>Verifier</CardTitle>
                <CardDescription>Employer or Verification Entity</CardDescription>
              </CardHeader>
              <div className="px-6 pb-4">
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>1. Scan QR codes instantly</li>
                  <li>2. Verify credentials securely</li>
                  <li>3. Access verification history</li>
                </ul>
              </div>
              <CardFooter>
                <Button asChild className="w-full" variant="secondary">
                  <Link to="/">Continue as Verifier</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
