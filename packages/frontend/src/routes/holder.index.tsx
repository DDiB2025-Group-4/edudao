import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { readContracts } from "@wagmi/core";
import { CheckCircle2, ExternalLink, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Hex } from "thirdweb";
import { download, resolveScheme } from "thirdweb/storage";
import { toHex, verifyMessage } from "viem";
import { useAccount, useConfig } from "wagmi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { EDUNFT_ABI } from "@/lib/abis";
import { thirdwebClient } from "@/lib/thirdweb";
import { useCredentialStore } from "@/store/credentialStore";
import type { Credential, ParsedCredential } from "@/types";

type VerificationStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
};

const VERIFICATION_STEPS: VerificationStep[] = [
  { id: "parse", label: "Parsing credential file", status: "pending" },
  { id: "blockchain", label: "Verifying blockchain data", status: "pending" },
  { id: "ownership", label: "Confirming ownership", status: "pending" },
  { id: "signature", label: "Validating signature", status: "pending" },
  { id: "metadata", label: "Fetching metadata", status: "pending" },
  { id: "hash", label: "Verifying credential hash", status: "pending" },
];

export const Route = createFileRoute("/holder/")({
  component: RouteComponent,
});

function RouteComponent() {
  const account = useAccount();
  const wagmiConfig = useConfig();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { credentials, addCredential, removeCredential } = useCredentialStore();

  const [isImporting, setIsImporting] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>(VERIFICATION_STEPS);
  const [importProgress, setImportProgress] = useState(0);

  const userCredentials = (account.address && credentials[account.address]) ?? [];

  const updateStep = (stepId: string, updates: Partial<VerificationStep>) => {
    setVerificationSteps((prev) => {
      const newSteps = prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step));
      const completed = newSteps.filter((step) => step.status === "completed").length;
      setImportProgress(Math.round((completed / newSteps.length) * 100));
      return newSteps;
    });
  };

  const resetVerificationSteps = () => {
    setVerificationSteps(VERIFICATION_STEPS.map((step) => ({ ...step, status: "pending", error: undefined })));
    setImportProgress(0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !account.address) return;

    resetVerificationSteps();
    setIsImporting(true);

    try {
      // Step 1: Parse credential file
      updateStep("parse", { status: "processing" });
      const text = await file.text();
      const credential = JSON.parse(text) as Credential;

      if (!credential.token || !credential.sdjwt) {
        updateStep("parse", { status: "error", error: "Invalid credential format" });
        throw new Error("Invalid credential format");
      }
      updateStep("parse", { status: "completed" });

      // Step 2: Verify blockchain data
      updateStep("blockchain", { status: "processing" });
      const [issuerAddress, studentAddress, tokenUri] = await readContracts(wagmiConfig, {
        contracts: [
          {
            address: credential.token.address,
            abi: EDUNFT_ABI,
            functionName: "owner",
          },
          {
            address: credential.token.address,
            abi: EDUNFT_ABI,
            functionName: "ownerOf",
            args: [BigInt(credential.token.tokenId)],
          },
          {
            address: credential.token.address,
            abi: EDUNFT_ABI,
            functionName: "tokenURI",
            args: [BigInt(credential.token.tokenId)],
          },
        ],
      });

      if (!issuerAddress.result || !studentAddress.result || !tokenUri.result) {
        updateStep("blockchain", { status: "error", error: "Failed to fetch token details" });
        throw new Error("Failed to fetch token details");
      }
      updateStep("blockchain", { status: "completed" });

      // Step 3: Confirm ownership
      updateStep("ownership", { status: "processing" });
      if (issuerAddress.result !== credential.issuerAddress) {
        updateStep("ownership", { status: "error", error: "Issuer address mismatch" });
        throw new Error("Issuer address does not match the credential");
      }
      if (studentAddress.result !== account.address) {
        updateStep("ownership", { status: "error", error: "Not the owner of this credential" });
        throw new Error("This credential does not belong to the current user");
      }
      updateStep("ownership", { status: "completed" });

      // Step 4: Validate signature
      updateStep("signature", { status: "processing" });
      const sdjwt = new SDJwtVcInstance({
        signAlg: "ECDSA",
        verifier: async (message, sig) => {
          return verifyMessage({
            message,
            signature: sig as Hex,
            address: credential.issuerAddress,
          });
        },
        hasher: sha256,
        hashAlg: "sha-256",
        saltGenerator: () => crypto.randomUUID(),
      });

      const valid = await sdjwt.verify(credential.sdjwt);
      if (!valid) {
        updateStep("signature", { status: "error", error: "Invalid signature" });
        throw new Error("Invalid SD-JWT credential");
      }
      updateStep("signature", { status: "completed" });

      // Step 5: Fetch metadata
      updateStep("metadata", { status: "processing" });
      const tokenMetadata = (await download({
        client: thirdwebClient,
        uri: tokenUri.result,
      }).then((res) => res.json())) as { image: string; credentialHash: string };

      if (!tokenMetadata || !tokenMetadata.image || !tokenMetadata.credentialHash) {
        updateStep("metadata", { status: "error", error: "Invalid metadata" });
        throw new Error("Invalid token metadata");
      }
      updateStep("metadata", { status: "completed" });

      // Step 6: Verify credential hash
      updateStep("hash", { status: "processing" });
      if (tokenMetadata.credentialHash !== toHex(sha256(credential.sdjwt))) {
        updateStep("hash", { status: "error", error: "Hash mismatch" });
        throw new Error("Credential hash does not match the token metadata");
      }

      const thumbnailHttps = await resolveScheme({
        client: thirdwebClient,
        uri: tokenMetadata.image,
      });
      updateStep("hash", { status: "completed" });

      const parsedCredential: ParsedCredential = {
        ...credential,
        claims: valid.payload as unknown as ParsedCredential["claims"],
        additional: {
          thumbnailUri: tokenMetadata.image,
          thumbnailHttps: thumbnailHttps,
        },
      };

      addCredential(account.address, parsedCredential);
      toast.success("Credential imported successfully!");

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to import credential:", error);
      toast.error(`Failed to import credential: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCredentialClick = (tokenId: string) => {
    navigate({ to: `/holder/${tokenId}` });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-2xl text-foreground">My Credentials</h1>
          <p className="text-muted-foreground">
            Import and manage your educational credentials. View details and generate verifiable presentations.
          </p>
        </div>

        {userCredentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Alert className="mb-6 max-w-md">
              <Upload className="h-4 w-4" />
              <AlertTitle>No credentials yet</AlertTitle>
              <AlertDescription>
                Import your credential JSON files to get started. These files are provided by your educational
                institution.
              </AlertDescription>
            </Alert>

            <Button onClick={handleImportClick} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Import Credential
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button onClick={handleImportClick} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import More
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(userCredentials as ParsedCredential[]).map((credential) => (
                <Card
                  key={credential.token.tokenId}
                  className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                  onClick={() => handleCredentialClick(credential.token.tokenId)}
                >
                  <CardHeader className="pb-3">
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
                      <img
                        src={credential.additional.thumbnailHttps}
                        alt={`${credential.claims.university} credential`}
                        className="h-full w-full object-cover"
                      />
                    </AspectRatio>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div>
                      <CardTitle className="line-clamp-1 text-lg">{credential.claims.university}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {credential.claims.name || "Student Name"}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {credential.claims.degreeLevel && (
                        <Badge variant="secondary" className="text-xs">
                          {credential.claims.degreeLevel}
                        </Badge>
                      )}
                      {credential.claims.graduationYear && (
                        <Badge variant="outline" className="text-xs">
                          {credential.claims.graduationYear}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCredentialClick(credential.token.tokenId);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (account.address && confirm("Are you sure you want to remove this credential?")) {
                          removeCredential(account.address, credential.token.tokenId);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Importing Credential</DialogTitle>
            <DialogDescription>
              Verifying your credential. Please wait while we validate the information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>

            <div className="space-y-3">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    {step.status === "pending" && <div className="h-2 w-2 rounded-full bg-gray-300" />}
                    {step.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {step.status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {step.status === "error" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 font-bold text-white text-xs">
                        !
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        step.status === "error"
                          ? "text-red-600"
                          : step.status === "completed"
                            ? "text-green-600"
                            : step.status === "processing"
                              ? "text-primary"
                              : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.error && <p className="mt-1 text-red-600 text-xs">{step.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
