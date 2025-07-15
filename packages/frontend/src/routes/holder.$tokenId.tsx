import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCheck, Copy, Eye, EyeOff, QrCode, Shield } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [showSensitive, setShowSensitive] = useState(false);
  const [selectiveDisclosure, setSelectiveDisclosure] = useState<SelectiveDisclosure>({
    name: true,
    degreeLevel: true,
    graduationYear: true,
    faculty: true,
  });

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

  const generateQrCode = () => {
    // Mock QR code generation
    const selectedFields = Object.entries(selectiveDisclosure)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field);

    const mockPresentation = {
      credential: credential.sdjwt,
      disclosed: selectedFields,
      timestamp: Date.now(),
    };

    // In a real implementation, this would generate an actual QR code
    console.log("Generated presentation:", mockPresentation);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(mockPresentation))}`;
  };

  const PropertyRow: FC<{
    label: string;
    value: string;
    copyable?: boolean;
    sensitive?: boolean;
  }> = ({ label, value, copyable = false, sensitive = false }) => {
    const displayValue = sensitive && !showSensitive ? "••••••••••••" : value;

    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="break-all font-mono text-sm">{displayValue}</p>
        </div>
        {copyable && (
          <Button variant="ghost" size="sm" onClick={() => handleCopy(value, label)} className="ml-2">
            {copied === label ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate({ to: "/holder" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Credentials
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{credential.parsedData.university}</CardTitle>
                    <CardDescription>Educational Credential</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AspectRatio ratio={16 / 9} className="mb-6 overflow-hidden rounded-md bg-muted">
                  <img
                    src={credential.parsedData.thumbnail}
                    alt={`${credential.parsedData.university} credential`}
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold text-lg">Basic Information</h3>
                    <div className="space-y-1">
                      <PropertyRow label="University" value={credential.parsedData.university} />
                      <PropertyRow
                        label="Student Name"
                        value={credential.parsedData.name || "Not disclosed"}
                        sensitive
                      />
                      <PropertyRow label="Degree Level" value={credential.parsedData.degreeLevel || "Not disclosed"} />
                      <PropertyRow label="Faculty" value={credential.parsedData.faculty || "Not disclosed"} />
                      <PropertyRow
                        label="Graduation Year"
                        value={credential.parsedData.graduationYear || "Not disclosed"}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Technical Details</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowSensitive(!showSensitive)}>
                        {showSensitive ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <PropertyRow label="Token ID" value={credential.token.tokenId} copyable />
                      <PropertyRow label="Contract Address" value={credential.token.address} copyable sensitive />
                      <PropertyRow label="Chain ID" value={credential.token.chainId.toString()} />
                      <PropertyRow
                        label="Issuer Address"
                        value={credential.parsedData.issuerAddress}
                        copyable
                        sensitive
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selective Disclosure</CardTitle>
                <CardDescription>Choose which fields to include in your verifiable presentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="default">
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Verifiable Presentation</DialogTitle>
                      <DialogDescription>Share this QR code with verifiers to prove your credentials</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="rounded-lg border bg-white p-4">
                        <img src={generateQrCode()} alt="Verifiable presentation QR code" className="h-64 w-64" />
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
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy Protected</AlertTitle>
              <AlertDescription className="text-sm">
                Your credential data is stored locally and never sent to external servers. Only you control what
                information to share.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
