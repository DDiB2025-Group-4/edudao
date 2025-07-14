import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type Address, isAddress } from "viem";
import { useAccount } from "wagmi";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNftsMetadata } from "@/hooks/blockchain";
import { useOwnEduNfts } from "@/hooks/thirdweb";

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
  thumbnailImage: z.instanceof(FileList).optional(),
});

const GraduationCertificateForm: FC<{
  selectedUniversity?: { address: Address; name: string };
}> = ({ selectedUniversity }) => {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // TODO: Implement NFT minting and SD-JWT creation
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
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

        <Button type="submit" className="w-full">
          Issue Graduation Certificate
        </Button>
      </form>
    </Form>
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

  if (!account.address) {
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

        <GraduationCertificateForm selectedUniversity={selectedUniversity} />
      </div>
    </div>
  );
}
