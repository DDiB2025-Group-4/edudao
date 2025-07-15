import { zodResolver } from "@hookform/resolvers/zod";
import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { upload } from "thirdweb/storage";
import { uuidv7 } from "uuidv7";
import { type Address, hexToBigInt, isAddress, toHex } from "viem";
import { type UseAccountReturnType, useAccount, useSignMessage, useWriteContract } from "wagmi";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNftsMetadata } from "@/hooks/blockchain";
import { useOwnEduNfts } from "@/hooks/thirdweb";
import { EDUNFT_ABI } from "@/lib/abis";
import { thirdwebClient } from "@/lib/thirdweb";
import type { Credential } from "@/types";

export const Route = createFileRoute("/issuer")({
  component: RouteComponent,
});

const formSchema = z.object({
  studentWalletAddress: z
    .string()
    .min(42, { message: "Please enter a valid wallet address" })
    .refine((val) => isAddress(val), { message: "Invalid wallet address" }),
  universityName: z.string().min(2, {
    message: "University name must be at least 2 characters",
  }),
  studentName: z.string().min(2, {
    message: "Student name must be at least 2 characters",
  }),
  faculty: z.string().trim().min(1, {
    message: "Please select a faculty",
  }),
  degreeLevel: z.string().trim().min(1, {
    message: "Please select a degree level",
  }),
  graduationYear: z.string().trim().min(1, {
    message: "Please select a graduation year",
  }),
  thumbnailImage: z.instanceof(FileList),
});

const GraduationCertificateForm: FC<{
  account: UseAccountReturnType;
  selectedUniversity: { address: Address; name: string };
}> = ({ account, selectedUniversity }) => {
  const { writeContract } = useWriteContract();
  const { signMessage } = useSignMessage();
  const [generatedCredential, setGeneratedCredential] = useState<Credential | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityName: selectedUniversity?.name || "",
      studentName: "",
      faculty: "",
      degreeLevel: "",
      graduationYear: "",
    },
  });

  useEffect(() => {
    if (selectedUniversity?.name) {
      form.setValue("universityName", selectedUniversity.name);
    }
  }, [selectedUniversity, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!account.address || !account.chainId) return;

    const sdjwt = new SDJwtVcInstance({
      signer: async (message) => new Promise((onSuccess, onError) => signMessage({ message }, { onSuccess, onError })),
      signAlg: "ECDSA",
      hasher: sha256,
      hashAlg: "sha-256",
      saltGenerator: () => crypto.randomUUID(),
    });

    const tokenId = hexToBigInt(`0x${uuidv7().replace(/-/g, "")}`);

    const claims = {
      address: values.studentWalletAddress,
      university: values.universityName,
      issuerAddress: account.address,
      tokenAddress: selectedUniversity.address,
      tokenId: String(tokenId),
      name: values.studentName,
      degreeLevel: values.degreeLevel,
      graduationYear: values.graduationYear,
      faculty: values.faculty,
    };
    const sdjwtCredential = await sdjwt.issue(
      { iss: "University", iat: Date.now() / 1000, vct: "EduDAO-Graduation", ...claims },
      { _sd: ["name", "degreeLevel", "graduationYear", "faculty"] },
    );

    const fileToUpload = new File(
      [values.thumbnailImage[0]],
      `thumbnail.${values.thumbnailImage[0].name.split(".").pop() || "jpg"}`,
      { type: values.thumbnailImage[0].type, lastModified: Date.now() },
    );
    const uploadedImageUri = await upload({
      client: thirdwebClient,
      files: [fileToUpload],
    });

    const nftMetadata = {
      name: `${values.universityName} - Graduation Certificate for ${values.studentWalletAddress}`,
      description: `Graduation certificate issued by ${values.universityName} for ${values.studentWalletAddress}`,
      image: uploadedImageUri,
      credentialHash: toHex(sha256(sdjwtCredential)),
      attributes: [
        { trait_type: "University", value: values.universityName },
        { trait_type: "Student Address", value: values.studentWalletAddress },
        { trait_type: "Credendial Hash", value: toHex(sha256(sdjwtCredential)) },
      ],
    };

    const uploadedMetadataUri = await upload({
      client: thirdwebClient,
      files: [new File([JSON.stringify(nftMetadata)], "metadata.json")],
    });

    await new Promise<unknown>((resolve, reject) => {
      writeContract(
        {
          address: selectedUniversity.address,
          abi: EDUNFT_ABI,
          functionName: "mint",
          args: [values.studentWalletAddress, tokenId, uploadedMetadataUri],
        },
        { onSuccess: resolve, onError: reject },
      );
    });

    const credential = {
      issuerAddress: account.address,
      token: { chainId: account.chainId as number, address: selectedUniversity.address, tokenId: String(tokenId) },
      sdjwt: sdjwtCredential,
    } satisfies Credential;

    console.log("Graduation certificate issued successfully:", credential);
    setGeneratedCredential(credential);
    setIsSubmitted(true);
  };

  const downloadCredential = () => {
    if (!generatedCredential) return;

    const dataStr = JSON.stringify(generatedCredential, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `credential_${generatedCredential.token.tokenId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="studentWalletAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Wallet Address</FormLabel>
                <FormControl>
                  <Input placeholder="0x..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="universityName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>University Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter university name" {...field} disabled={!!selectedUniversity} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter student name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="faculty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a faculty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="degreeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select degree level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="associate">Associate Degree</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="graduationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Graduation Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select graduation year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="thumbnailImage"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Thumbnail Image</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...field} />
                </FormControl>
                <FormDescription>This image will be displayed on the NFT (public)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isSubmitted}>
            {isSubmitted ? "Certificate Already Issued" : "Issue Graduation Certificate"}
          </Button>

          {!isSubmitted && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important: One-time Generation</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Once generated, credentials cannot be regenerated</li>
                  <li>Store the credential JSON file securely</li>
                  <li>Handle credential sharing with students carefully</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>

      {isSubmitted && generatedCredential && (
        <Card className="mt-6 ">
          <CardHeader>
            <CardTitle>Certificate Issued Successfully</CardTitle>
            <CardDescription>Download the credential JSON file and provide it to the student.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="mb-1 font-medium text-sm">Token ID:</p>
                <p className="font-mono text-xs">{generatedCredential.token.tokenId}</p>
              </div>
              <Button onClick={downloadCredential} className="w-full" variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download Credential as JSON
              </Button>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This file cannot be re-downloaded. Please store it in a secure location immediately.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

function RouteComponent() {
  const account = useAccount();
  const ownEduNftsQuery = useOwnEduNfts(account);

  const [selectedUniversity, setSelectedUniversity] = useState<{ address: Address; name: string } | undefined>();

  const nftAddresses = ownEduNftsQuery.data || [];
  const nftsMetadata = useNftsMetadata(nftAddresses);

  useEffect(() => {
    if (nftAddresses.length === 1 && nftsMetadata.data?.[0]?.result) {
      setSelectedUniversity({
        address: nftAddresses[0],
        name: nftsMetadata.data[0].result as string,
      });
    }
  }, [nftAddresses, nftsMetadata.data]);

  if (ownEduNftsQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (account.status !== "connected") {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertTitle>Wallet Connection Required</AlertTitle>
            <AlertDescription>Please connect your wallet to issue certificates.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (nftAddresses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertTitle>No Issuing Permissions</AlertTitle>
            <AlertDescription>
              You don't have permission to issue certificates. You need to get approval from the DAO.
              <a
                href="https://docs.edudao.example.com/getting-started/authorization"
                className="ml-1 font-medium underline underline-offset-4"
              >
                Learn more
              </a>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="font-bold text-foreground text-lg">Issue Graduation Certificate</div>
        <div className="mb-6 text-muted-foreground text-sm">
          Create an NFT with thumbnail and university name, plus a signed SD-JWT with full credentials
        </div>

        {nftAddresses.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Issuing University</CardTitle>
              <CardDescription>
                You have issuing permissions for multiple universities. Please select the university to issue the
                certificate from.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedUniversity?.address}
                onValueChange={(value) => {
                  const index = nftAddresses.findIndex((addr) => addr === value);
                  if (index !== -1 && nftsMetadata.data?.[index]?.result) {
                    setSelectedUniversity({
                      address: value as Address,
                      name: nftsMetadata.data[index].result as string,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  {nftAddresses.map((address, index) => {
                    const name = nftsMetadata.data?.[index]?.result as string | undefined;
                    return (
                      <SelectItem key={address} value={address}>
                        {name || `University ${index + 1}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {selectedUniversity && <GraduationCertificateForm selectedUniversity={selectedUniversity} account={account} />}
      </div>
    </div>
  );
}
