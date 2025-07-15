import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute } from "@tanstack/react-router";
import { readContracts } from "@wagmi/core";
import type { Result as ScanResult } from "@zxing/library";
import { AlertCircle, Camera, CheckCircle, CheckCircle2, Loader2, QrCode, Shield, Type, XCircle, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
import type { Hex } from "thirdweb";
import { download, resolveScheme } from "thirdweb/storage";
import { type Address, verifyMessage } from "viem";
import { useConfig } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EDUNFT_ABI } from "@/lib/abis";
import { thirdwebClient } from "@/lib/thirdweb";

export const Route = createFileRoute("/verifier")({
  component: VerifierPage,
  validateSearch: (search) => {
    return { data: search.data ? search.data : undefined };
  },
});

interface VerificationResult {
  success: boolean;
  certificate?: {
    name?: string;
    university?: string;
    degreeLevel?: string;
    graduationYear?: string;
    faculty?: string;
    issuerAddress?: string;
    issuedAt: string;
    nftImage?: string;
  };
  disclosedFields: string[];
  error?: string;
  tokenInfo?: {
    address: Address;
    tokenId: string;
    chainId: number;
  };
}

type VerificationStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error" | "skipped";
  error?: string;
};

interface ScanState {
  isScanning: boolean;
  isProcessing: boolean;
  result: VerificationResult | null;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface ScannerState {
  devices: CameraDevice[];
  selectedDeviceId: string | undefined;
  torch: boolean;
  stopStream: boolean;
  scannerError: string | null;
  manualInput: string;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  { id: "parse", label: "Parsing presentation data", status: "pending" },
  { id: "signature", label: "Verifying SD-JWT signature", status: "pending" },
  { id: "timestamp", label: "Validating timestamp", status: "pending" },
  { id: "blockchain", label: "Verifying blockchain data", status: "pending" },
  { id: "metadata", label: "Fetching NFT metadata", status: "pending" },
  { id: "claims", label: "Validating disclosed claims", status: "pending" },
];

function VerifierPage() {
  const { data: injectedPayload } = Route.useSearch();
  const wagmiConfig = useConfig();

  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    isProcessing: false,
    result: null,
  });

  const [scannerState, setScannerState] = useState<ScannerState>({
    devices: [],
    selectedDeviceId: undefined,
    torch: false,
    stopStream: false,
    scannerError: null,
    manualInput: "",
  });

  const [activeTab, setActiveTab] = useState("scanner");
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>(VERIFICATION_STEPS);
  const [verificationProgress, setVerificationProgress] = useState(0);

  const updateStep = useCallback((stepId: string, updates: Partial<VerificationStep>) => {
    setVerificationSteps((prev) => {
      const newSteps = prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step));
      const completed = newSteps.filter((step) => step.status === "completed").length;
      setVerificationProgress(Math.round((completed / newSteps.length) * 100));
      return newSteps;
    });
  }, []);

  const resetVerificationSteps = useCallback(() => {
    setVerificationSteps(VERIFICATION_STEPS.map((step) => ({ ...step, status: "pending", error: undefined })));
    setVerificationProgress(0);
  }, []);

  // Process QR data with multi-step verification
  const processQRData = useCallback(async (_qrData: string) => {
    console.log("Processing QR data:", _qrData);
    resetVerificationSteps();
    setScanState((prev) => ({ ...prev, isProcessing: true, result: null }));

    const disclosedFields: string[] = [];
    let nftImage: string | undefined;

    try {
      // Step 1: Parse presentation data
      updateStep("parse", { status: "processing" });
      let presentationData: {
        studentAddress: Address;
        presantation: string; // Note: typo in original
        timestamp: number;
        signature: Hex;
        tokenInfo?: {
          address: Address;
          tokenId: string;
          chainId: number;
        };
      };

      try {
        presentationData = JSON.parse(_qrData);
        if (!presentationData.presantation || !presentationData.studentAddress) {
          throw new Error("Invalid presentation format");
        }
      } catch (error) {
        updateStep("parse", { status: "error", error: "Failed to parse presentation data" });
        throw error;
      }
      updateStep("parse", { status: "completed" });

      // Step 2: Verify SD-JWT signature
      updateStep("signature", { status: "processing" });
      const sdjwt = new SDJwtVcInstance({
        signAlg: "ECDSA",
        verifier: async (message, sig) =>
          verifyMessage({ message, signature: sig as Hex, address: presentationData.studentAddress }),
        hasher: sha256,
        hashAlg: "sha-256",
      });

      let verificationResult: { payload: Record<string, any> } | undefined;
      try {
        verificationResult = await sdjwt.verify(presentationData.presantation, { requiredClaimKeys: [] });
        if (!verificationResult) {
          throw new Error("Invalid signature");
        }
      } catch (error) {
        updateStep("signature", { status: "error", error: "Invalid SD-JWT signature" });
        throw error;
      }
      updateStep("signature", { status: "completed" });

      // Step 3: Validate timestamp
      updateStep("timestamp", { status: "processing" });
      const currentTime = Date.now();
      const timeDiff = currentTime - presentationData.timestamp;
      // Check if timestamp is within 5 minutes
      if (timeDiff > 5 * 60 * 1000) {
        updateStep("timestamp", { status: "error", error: "Presentation has expired" });
        throw new Error("Presentation timestamp is too old");
      }
      updateStep("timestamp", { status: "completed" });

      // Extract claims and track disclosed fields
      const claims = verificationResult.payload as Record<string, any>;
      const possibleFields = ["name", "university", "degreeLevel", "graduationYear", "faculty", "issuerAddress"];
      for (const field of possibleFields) {
        if (claims[field] !== undefined) {
          disclosedFields.push(field);
        }
      }

      // Step 4: Verify blockchain data (if token info is disclosed)
      if (presentationData.tokenInfo?.address) {
        updateStep("blockchain", { status: "processing" });
        try {
          const [issuerAddress, studentAddress, tokenUri] = await readContracts(wagmiConfig, {
            contracts: [
              {
                address: presentationData.tokenInfo.address,
                abi: EDUNFT_ABI,
                functionName: "owner",
              },
              {
                address: presentationData.tokenInfo.address,
                abi: EDUNFT_ABI,
                functionName: "ownerOf",
                args: [BigInt(presentationData.tokenInfo.tokenId)],
              },
              {
                address: presentationData.tokenInfo.address,
                abi: EDUNFT_ABI,
                functionName: "tokenURI",
                args: [BigInt(presentationData.tokenInfo.tokenId)],
              },
            ],
          });

          if (!issuerAddress.result || !studentAddress.result || !tokenUri.result) {
            updateStep("blockchain", { status: "error", error: "Failed to verify blockchain data" });
          } else {
            // Verify student address matches
            if (studentAddress.result !== presentationData.studentAddress) {
              updateStep("blockchain", { status: "error", error: "Student address mismatch" });
            } else {
              updateStep("blockchain", { status: "completed" });

              // Step 5: Fetch NFT metadata
              updateStep("metadata", { status: "processing" });
              try {
                const metadata = await download({
                  client: thirdwebClient,
                  uri: tokenUri.result,
                }).then((res) => res.json()) as { image?: string };

                if (metadata.image) {
                  nftImage = await resolveScheme({
                    client: thirdwebClient,
                    uri: metadata.image,
                  });
                }
                updateStep("metadata", { status: "completed" });
              } catch (error) {
                updateStep("metadata", { status: "error", error: "Failed to fetch metadata" });
              }
            }
          }
        } catch (error) {
          updateStep("blockchain", { status: "error", error: "Blockchain verification failed" });
        }
      } else {
        updateStep("blockchain", { status: "skipped" });
        updateStep("metadata", { status: "skipped" });
      }

      // Step 6: Validate disclosed claims
      updateStep("claims", { status: "processing" });
      if (disclosedFields.length === 0) {
        updateStep("claims", { status: "error", error: "No claims were disclosed" });
        throw new Error("No verifiable claims in presentation");
      }
      updateStep("claims", { status: "completed" });

      // Build result object with only disclosed fields
      const certificate: VerificationResult["certificate"] = {
        issuedAt: new Date(presentationData.timestamp).toISOString(),
      };

      if (claims.name !== undefined) certificate.name = claims.name;
      if (claims.university !== undefined) certificate.university = claims.university;
      if (claims.degreeLevel !== undefined) certificate.degreeLevel = claims.degreeLevel;
      if (claims.graduationYear !== undefined) certificate.graduationYear = claims.graduationYear;
      if (claims.faculty !== undefined) certificate.faculty = claims.faculty;
      if (claims.issuerAddress !== undefined) certificate.issuerAddress = claims.issuerAddress;
      if (nftImage) certificate.nftImage = nftImage;

      setScanState({
        isScanning: false,
        isProcessing: false,
        result: {
          success: true,
          certificate,
          disclosedFields,
          error: undefined,
          tokenInfo: presentationData.tokenInfo,
        },
      });
    } catch (error) {
      console.error("Verification failed:", error);
      setScanState({
        isScanning: false,
        isProcessing: false,
        result: {
          success: false,
          disclosedFields: [],
          error: error instanceof Error ? error.message : "Verification failed",
        },
      });
    }
  }, [wagmiConfig, updateStep, resetVerificationSteps]);

  // Handle QR code scan results
  const handleScanUpdate = useCallback(
    (err: unknown, result: ScanResult | undefined) => {
      if (err || !result) return;

      const text = result.getText();
      if (text && !scanState.isProcessing) {
        const parsed = new URLSearchParams(text);
        if (!parsed.has("data")) {
          setScannerState((prev) => ({ ...prev, scannerError: "Invalid QR code format" }));
          return;
        }

        setScannerState((prev) => ({ ...prev, stopStream: true }));
        processQRData(parsed.get("data") || "");
      }
    },
    [scanState.isProcessing, processQRData],
  );

  // Handle camera errors
  const handleScanError = useCallback((err: Error | string) => {
    const errorMessage = typeof err === "string" ? err : err.name;
    setScannerState((prev) => ({ ...prev, scannerError: errorMessage }));
  }, []);

  const handleStartScan = () => {
    setScanState({ isScanning: true, isProcessing: false, result: null });
    setScannerState((prev) => ({ ...prev, stopStream: false, scannerError: null }));
  };

  const handleManualVerify = useCallback(() => {
    if (!scannerState.manualInput.trim()) return;
    processQRData(scannerState.manualInput);
    setScannerState((prev) => ({ ...prev, manualInput: "" }));
  }, [processQRData, scannerState.manualInput]);

  const handleReset = () => {
    setScanState({ isScanning: false, isProcessing: false, result: null });
    setScannerState((prev) => ({ ...prev, stopStream: true, scannerError: null }));
  };

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
          }));
        setScannerState((prev) => ({ ...prev, devices: videoDevices, selectedDeviceId: videoDevices[0]?.deviceId }));
      })
      .catch((err) => {
        setScannerState((prev) => ({ ...prev, scannerError: err.message }));
      });
  }, []);

  useEffect(() => {
    if (injectedPayload) {
      setActiveTab("manual");
      const payloadString = typeof injectedPayload === "string" ? injectedPayload : JSON.stringify(injectedPayload);
      setScannerState((prev) => ({ ...prev, manualInput: payloadString }));
      processQRData(payloadString);
    }
  }, [injectedPayload, processQRData]);

  const videoConstraints: MediaTrackConstraints | undefined = scannerState.selectedDeviceId
    ? { deviceId: { exact: scannerState.selectedDeviceId } }
    : { facingMode: "environment" };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-bold text-3xl">Certificate Verifier</h1>
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Scan QR codes to verify digital certificates instantly. Our secure verification system ensures authenticity
          and prevents fraud.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Certificate Verification
            </CardTitle>
            <CardDescription>Scan a QR code or manually input certificate data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scanner" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="space-y-4">
                {/* Camera Controls */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Select
                      value={scannerState.selectedDeviceId || ""}
                      onValueChange={(value) =>
                        setScannerState((prev) => ({
                          ...prev,
                          selectedDeviceId: value || undefined,
                          stopStream: true, // Force restart with new camera
                        }))
                      }
                    >
                      <SelectTrigger id="camera-select" className="flex-1">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {scannerState.devices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex flex-col justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setScannerState((prev) => ({ ...prev, torch: !prev.torch }))}
                        disabled={!scanState.isScanning}
                      >
                        {scannerState.torch ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Scanner Display */}
                <div className="relative">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:object-cover">
                    {scanState.isScanning && !scannerState.stopStream ? (
                      <BarcodeScanner
                        torch={scannerState.torch}
                        stopStream={scannerState.stopStream}
                        videoConstraints={videoConstraints}
                        onUpdate={handleScanUpdate}
                        onError={handleScanError}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <QrCode className="mx-auto mb-2 h-12 w-12" />
                          <p>Camera ready</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scanning overlay */}
                  {scanState.isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-lg border-2 border-primary border-dashed opacity-50" />
                    </div>
                  )}
                </div>

                {/* Scanner Error */}
                {scannerState.scannerError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{scannerState.scannerError}</AlertDescription>
                  </Alert>
                )}

                {/* Control Button */}
                <Button
                  onClick={scanState.result ? handleReset : handleStartScan}
                  disabled={scanState.isProcessing}
                  className="w-full"
                  variant={scanState.result ? "outline" : "default"}
                >
                  {scanState.isProcessing
                    ? "Verifying..."
                    : scanState.result
                      ? "Scan Another"
                      : scanState.isScanning
                        ? "Scanning..."
                        : "Start Scanning"}
                </Button>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="manual-input" className="font-medium text-sm">
                    Certificate Data
                  </Label>
                  <Textarea
                    id="manual-input"
                    placeholder="Paste certificate data or QR code content here..."
                    value={scannerState.manualInput}
                    onChange={(e) => setScannerState((prev) => ({ ...prev, manualInput: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                <Button
                  onClick={handleManualVerify}
                  disabled={!scannerState.manualInput.trim() || scanState.isProcessing}
                  className="w-full"
                >
                  {scanState.isProcessing ? "Verifying..." : "Verify Certificate"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Results
            </CardTitle>
            <CardDescription>Certificate verification status and details</CardDescription>
          </CardHeader>
          <CardContent>
            {!scanState.result && !scanState.isScanning && !scanState.isProcessing && (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No verification results yet. Start scanning to verify a certificate.
                </p>
              </div>
            )}

            {(scanState.isScanning || scanState.isProcessing) && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2"></div>
                <p className="text-muted-foreground">
                  {scanState.isScanning ? "Scanning QR code..." : "Verifying certificate..."}
                </p>
              </div>
            )}

            {scanState.result && (
              <div className="space-y-4">
                <Alert className={scanState.result.success ? "border-primary" : "border-destructive"}>
                  {scanState.result.success ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription>
                    {scanState.result.success
                      ? "Certificate verified successfully!"
                      : scanState.result.error || "Verification failed"}
                  </AlertDescription>
                </Alert>

                {scanState.result.success && scanState.result.certificate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Certificate Details</h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Verified
                        </Badge>
                        <Badge variant="outline">
                          {scanState.result.disclosedFields.length} fields disclosed
                        </Badge>
                      </div>
                    </div>

                    {/* NFT Image if available */}
                    {scanState.result.certificate.nftImage && (
                      <div className="mb-4">
                        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
                          <img
                            src={scanState.result.certificate.nftImage}
                            alt="Certificate NFT"
                            className="h-full w-full object-cover"
                          />
                        </AspectRatio>
                      </div>
                    )}

                    <div className="grid gap-3">
                      {/* Only show disclosed fields */}
                      {scanState.result.certificate.name !== undefined && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">Name:</span>
                            <span className="col-span-2 text-sm">{scanState.result.certificate.name}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {scanState.result.certificate.university !== undefined && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">University:</span>
                            <span className="col-span-2 text-sm truncate">{scanState.result.certificate.university}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {scanState.result.certificate.degreeLevel !== undefined && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">Degree:</span>
                            <span className="col-span-2 text-sm">{scanState.result.certificate.degreeLevel}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {scanState.result.certificate.faculty !== undefined && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">Faculty:</span>
                            <span className="col-span-2 text-sm">{scanState.result.certificate.faculty}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {scanState.result.certificate.graduationYear !== undefined && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">Graduation:</span>
                            <span className="col-span-2 text-sm">{scanState.result.certificate.graduationYear}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {/* Always show issued date */}
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Issued:</span>
                        <span className="col-span-2 text-sm">
                          {new Date(scanState.result.certificate.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {scanState.result.certificate.issuerAddress !== undefined && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground text-sm">Issuer:</span>
                            <span className="col-span-2 font-mono text-xs truncate">
                              {scanState.result.certificate.issuerAddress}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Disclosed fields summary */}
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Disclosed Information:</strong> {scanState.result.disclosedFields.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Progress Dialog */}
      <Dialog open={scanState.isProcessing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verifying Presentation</DialogTitle>
            <DialogDescription>
              Please wait while we verify the credential presentation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{verificationProgress}%</span>
              </div>
              <Progress value={verificationProgress} className="w-full" />
            </div>

            <div className="space-y-3">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    {step.status === "pending" && <div className="h-2 w-2 rounded-full bg-gray-300" />}
                    {step.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {step.status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {step.status === "skipped" && <div className="h-5 w-5 text-gray-400">—</div>}
                    {step.status === "error" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
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
                              : step.status === "skipped"
                                ? "text-gray-400"
                                : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.error && <p className="mt-1 text-xs text-red-600">{step.error}</p>}
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
