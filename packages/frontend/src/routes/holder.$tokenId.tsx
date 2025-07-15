import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCheck, Copy, QrCode, Shield } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import type { Hex } from "viem";
import { useSignMessage } from "wagmi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCredentialStore } from "@/store/credentialStore";

export const Route = createFileRoute("/holder/$tokenId")({
  component: RouteComponent,
});

interface SelectiveDisclosure {
  name: boolean;
  degreeLevel: boolean;
  graduationYear: boolean;
  faculty: boolean;
}

function RouteComponent() {
  const navigate = useNavigate();
  const { tokenId } = Route.useParams();
  const credential = useCredentialStore((state) => state.getCredential(tokenId));
  const [copied, setCopied] = useState<string | null>(null);
  const [selectiveDisclosure, setSelectiveDisclosure] = useState<SelectiveDisclosure>({
    name: true,
    degreeLevel: true,
    graduationYear: true,
    faculty: true,
  });
  const { signMessage } = useSignMessage();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  if (!credential) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertTitle>Credential not found</AlertTitle>
            <AlertDescription>The requested credential could not be found. It may have been removed.</AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/holder" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Credentials
          </Button>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateQrCode = async () => {
    // Mock QR code generation
    console.log(selectiveDisclosure);

    const sdjwt = new SDJwtVcInstance({ hasher: sha256, hashAlg: "sha-256" });

    const payloadToSign = {
      presantation: await sdjwt.present(credential.sdjwt),
      timestamp: Date.now(),
    };
    const message = JSON.stringify(payloadToSign);
    const signature = await new Promise<Hex>((onSuccess, onError) => signMessage({ message }, { onSuccess, onError }));

    const payload = { ...payloadToSign, signature };

    // In a real implementation, this would generate an actual QR code
    console.log("Generated presentation:", payload);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(JSON.stringify(payload))}`;

    setQrCodeUrl(url);
  };

  const PropertyRow: FC<{
    label: string;
    value: string;
    copyable?: boolean;
  }> = ({ label, value, copyable = false }) => {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="break-all font-mono text-sm">{value}</p>
        </div>
        {copyable && (
          <Button variant="ghost" size="sm" onClick={() => handleCopy(value, label)} className="ml-2 h-8 px-2">
            {copied === label ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate({ to: "/holder" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Credentials
        </Button>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Main Content */}
          <div className="space-y-4 lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{credential.claims.university}</CardTitle>
                    <CardDescription>Educational Credential</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 overflow-hidden rounded-md border bg-muted">
                  <img
                    src={credential.additional.thumbnailHttps}
                    alt={`${credential.claims.university} credential`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold text-base">Basic Information</h3>
                    <div className="divide-y">
                      <PropertyRow label="University" value={credential.claims.university} />
                      <PropertyRow label="Student Name" value={credential.claims.name || "Not disclosed"} />
                      <PropertyRow label="Degree Level" value={credential.claims.degreeLevel || "Not disclosed"} />
                      <PropertyRow label="Faculty" value={credential.claims.faculty || "Not disclosed"} />
                      <PropertyRow
                        label="Graduation Year"
                        value={credential.claims.graduationYear || "Not disclosed"}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 font-semibold text-base">Technical Details</h3>
                    <div className="divide-y">
                      <PropertyRow label="Token ID" value={credential.token.tokenId} copyable />
                      <PropertyRow label="Contract Address" value={credential.token.address} copyable />
                      <PropertyRow label="Chain ID" value={credential.token.chainId.toString()} />
                      <PropertyRow label="Issuer Address" value={credential.claims.issuerAddress} copyable />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selective Disclosure</CardTitle>
                <CardDescription className="text-xs">
                  Choose which fields to include in your verifiable presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="university" checked={true} disabled />
                    <Label htmlFor="university" className="font-normal text-sm opacity-75">
                      University (Always included)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="name"
                      checked={selectiveDisclosure.name}
                      onCheckedChange={(checked) =>
                        setSelectiveDisclosure({
                          ...selectiveDisclosure,
                          name: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="name" className="cursor-pointer font-normal text-sm">
                      Student Name
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="degreeLevel"
                      checked={selectiveDisclosure.degreeLevel}
                      onCheckedChange={(checked) =>
                        setSelectiveDisclosure({
                          ...selectiveDisclosure,
                          degreeLevel: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="degreeLevel" className="cursor-pointer font-normal text-sm">
                      Degree Level
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="graduationYear"
                      checked={selectiveDisclosure.graduationYear}
                      onCheckedChange={(checked) =>
                        setSelectiveDisclosure({
                          ...selectiveDisclosure,
                          graduationYear: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="graduationYear" className="cursor-pointer font-normal text-sm">
                      Graduation Year
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="faculty"
                      checked={selectiveDisclosure.faculty}
                      onCheckedChange={(checked) =>
                        setSelectiveDisclosure({
                          ...selectiveDisclosure,
                          faculty: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="faculty" className="cursor-pointer font-normal text-sm">
                      Faculty
                    </Label>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="verification" checked={true} disabled />
                      <Label htmlFor="verification" className="font-normal text-sm opacity-75">
                        Verification Data (Always included)
                      </Label>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="default" onClick={handleGenerateQrCode}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>

                <Dialog open={!!qrCodeUrl} onOpenChange={(open) => !open && setQrCodeUrl(null)}>
                  <DialogContent className="sm:ma max-w-screen xs:max-w-[calc(100%-2rem)] rounded-none px-4 sm:max-w-lg sm:rounded-md">
                    <DialogHeader>
                      <DialogTitle>Verifiable Presentation</DialogTitle>
                      <DialogDescription>Share this QR code with verifiers to prove your credentials</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="rounded-lg border bg-white p-4">
                        <img
                          src={qrCodeUrl ?? ""}
                          alt="Verifiable presentation QR code"
                          className="aspect-square h-full w-full"
                        />
                      </div>
                      <Alert>
                        <AlertDescription className="text-sm">
                          This QR code contains only the selected fields. The verifier can validate the authenticity
                          without seeing undisclosed information.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Alert>
              <Shield className="h-3 w-3" />
              <AlertTitle className="text-sm">Privacy Protected</AlertTitle>
              <AlertDescription className="text-xs">
                Your credential data is stored locally and never sent to external servers.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
