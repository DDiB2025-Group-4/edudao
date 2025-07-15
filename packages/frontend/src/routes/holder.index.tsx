import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import type { FC } from "react";
import { useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCredentialStore } from "@/store/credentialStore";
import type { Credential } from "@/types";

export const Route = createFileRoute("/holder/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { credentials, addCredential, removeCredential } = useCredentialStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const credential = JSON.parse(text) as Credential;

      // Validate credential structure
      if (!credential.token || !credential.sdjwt) {
        throw new Error("Invalid credential format");
      }

      addCredential(credential);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to import credential:", error);
      alert("Failed to import credential. Please ensure the file is a valid credential JSON.");
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
          <h1 className="font-bold text-foreground text-2xl mb-2">My Credentials</h1>
          <p className="text-muted-foreground">
            Import and manage your educational credentials. View details and generate verifiable presentations.
          </p>
        </div>

        {credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Alert className="max-w-md mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {credentials.map((credential) => (
                <Card
                  key={credential.token.tokenId}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCredentialClick(credential.token.tokenId)}
                >
                  <CardHeader className="pb-3">
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
                      <img
                        src={credential.parsedData.thumbnail}
                        alt={`${credential.parsedData.university} credential`}
                        className="h-full w-full object-cover"
                      />
                    </AspectRatio>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{credential.parsedData.university}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {credential.parsedData.name || "Student Name"}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {credential.parsedData.degreeLevel && (
                        <Badge variant="secondary" className="text-xs">
                          {credential.parsedData.degreeLevel}
                        </Badge>
                      )}
                      {credential.parsedData.graduationYear && (
                        <Badge variant="outline" className="text-xs">
                          {credential.parsedData.graduationYear}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 flex justify-between">
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
                        if (confirm("Are you sure you want to remove this credential?")) {
                          removeCredential(credential.token.tokenId);
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
