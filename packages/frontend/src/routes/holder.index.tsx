import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { readContracts } from "@wagmi/core";
import { ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
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
import { EDUNFT_ABI } from "@/lib/abis";
import { thirdwebClient } from "@/lib/thirdweb";
import { useCredentialStore } from "@/store/credentialStore";
import type { Credential, ParsedCredential } from "@/types";

export const Route = createFileRoute("/holder/")({
  component: RouteComponent,
});

function RouteComponent() {
  const account = useAccount();
  const wagmiConfig = useConfig();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { credentials, addCredential, removeCredential } = useCredentialStore();

  const userCredentials = (account.address && credentials[account.address]) ?? [];
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !account.address) return;

    try {
      const text = await file.text();
      const credential = JSON.parse(text) as Credential;

      // Validate credential structure
      if (!credential.token || !credential.sdjwt) throw new Error("Invalid credential format");

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
      console.log("Issuer Address:", issuerAddress);
      console.log("Student Address:", studentAddress);
      console.log("Token URI:", tokenUri);

      if (!issuerAddress.result || !studentAddress.result || !tokenUri.result)
        throw new Error("Failed to fetch token details");
      if (issuerAddress.result !== credential.issuerAddress)
        throw new Error("Issuer address does not match the credential");
      if (studentAddress.result !== account.address)
        throw new Error("This credential does not belong to the current user");

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
      if (!valid) throw new Error("Invalid SD-JWT credential");

      const tokenMetadata = (await download({
        client: thirdwebClient,
        uri: tokenUri.result,
      }).then((res) => res.json())) as { image: string; credentialHash: string };

      if (!tokenMetadata || !tokenMetadata.image || !tokenMetadata.credentialHash)
        throw new Error("Invalid token metadata");

      if (tokenMetadata.credentialHash !== toHex(sha256(credential.sdjwt)))
        throw new Error("Credential hash does not match the token metadata");

      const thumbnailHttps = await resolveScheme({
        client: thirdwebClient,
        uri: tokenMetadata.image,
      });

      const parsedCredential: ParsedCredential = {
        ...credential,
        claims: valid.payload as unknown as ParsedCredential["claims"],
        additional: {
          thumbnailUri: tokenMetadata.image, // Placeholder, replace with actual logic
          thumbnailHttps: thumbnailHttps, // Placeholder, replace with actual
        },
      };

      addCredential(account.address, parsedCredential);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
              {userCredentials.map((credential) => (
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
    </div>
  );
}
