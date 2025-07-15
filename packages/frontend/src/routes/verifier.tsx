import { sha256 } from "@sd-jwt/hash";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { createFileRoute } from "@tanstack/react-router";
import type { Result as ScanResult } from "@zxing/library";
import { AlertCircle, Camera, CheckCircle, QrCode, Shield, Type, XCircle, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
import type { Hex } from "thirdweb";
import { type Address, verifyMessage } from "viem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedCredential } from "@/types";

export const Route = createFileRoute("/verifier")({
  component: VerifierPage,
  validateSearch: (search) => {
    return { data: search.data ? search.data : undefined };
  },
});

interface VerificationResult {
  success: boolean;
  certificate?: {
    name: string;
    university: string;
    degreeLevel: string;
    graduationYear: string;
    faculty: string;
    issuerAddress: string;
    issuedAt: string;
    verificationHash: string;
  };
  error?: string;
}

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

function VerifierPage() {
  const { data: injectedPayload } = Route.useSearch();

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

  const mockQRData = {
    name: "John Doe",
    university: "Harvard University",
    degreeLevel: "Bachelor's Degree",
    graduationYear: "2023",
    faculty: "Computer Science",
    issuerAddress: "0x1234...5678",
    issuedAt: "2023-06-15T10:30:00Z",
    verificationHash: "0xabcd1234ef567890...",
  };

  // Process QR data (mock verification)
  const processQRData = useCallback(async (_qrData: string) => {
    console.log("Processing QR data:", _qrData);
    setScanState((prev) => ({ ...prev, isProcessing: true, result: null }));

    const credential = JSON.parse(_qrData) as {
      studentAddress: Address;
      presantation: string;
      timestamp: number;
      signature: Hex;
    };

    const sdjwt = new SDJwtVcInstance({
      signAlg: "ECDSA",
      verifier: async (message, sig) =>
        verifyMessage({ message, signature: sig as Hex, address: credential.studentAddress }),
      hasher: sha256,
      hashAlg: "sha-256",
    });
    console.log("Verifying SD-JWT presentation:", credential);

    const valid = await sdjwt.verify(credential.presantation, { requiredClaimKeys: [] });
    console.log("SD-JWT verification result:", valid);

    const claims = valid.payload as unknown as ParsedCredential["claims"];

    setScanState({
      isScanning: false,
      isProcessing: false,
      result: {
        success: true,
        certificate: {
          name: claims.name,
          university: claims.university,
          degreeLevel: claims.degreeLevel,
          graduationYear: claims.graduationYear,
          faculty: claims.faculty,
          issuerAddress: claims.issuerAddress,
          issuedAt: new Date(credential.timestamp).toISOString(),
        },
        error: undefined,
      },
    });
  }, []);

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
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        Verified
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Name:</span>
                        <span className="col-span-2 text-sm">{scanState.result.certificate.name}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">University:</span>
                        <span className="col-span-2 text-sm truncate">{scanState.result.certificate.university}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Degree:</span>
                        <span className="col-span-2 text-sm">{scanState.result.certificate.degreeLevel}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Faculty:</span>
                        <span className="col-span-2 text-sm">{scanState.result.certificate.faculty}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Graduation:</span>
                        <span className="col-span-2 text-sm">{scanState.result.certificate.graduationYear}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Issued:</span>
                        <span className="col-span-2 text-sm ">
                          {new Date(scanState.result.certificate.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Issuer:</span>
                        <span className="col-span-2 font-mono text-xs truncate">
                          {scanState.result.certificate.issuerAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
