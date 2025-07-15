import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, QrCode, Shield, XCircle } from "lucide-react";
import { useState } from "react";
import { BarcodeScanner } from "react-barcode-scanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import "react-barcode-scanner/polyfill";

export const Route = createFileRoute("/verifier")({
  component: VerifierPage,
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

function VerifierPage() {
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    isProcessing: false,
    result: null,
  });

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

  const handleStartScan = () => {
    setScanState({ isScanning: true, isProcessing: false, result: null });

    // Mock QR scan process
    setTimeout(() => {
      setScanState((prev) => ({ ...prev, isScanning: false, isProcessing: true }));

      // Mock verification process
      setTimeout(() => {
        const verificationResult: VerificationResult = {
          success: Math.random() > 0.2, // 80% success rate for demo
          certificate: mockQRData,
          error: Math.random() > 0.2 ? undefined : "Certificate verification failed",
        };

        setScanState({
          isScanning: false,
          isProcessing: false,
          result: verificationResult,
        });
      }, 2000);
    }, 1500);
  };

  const handleReset = () => {
    setScanState({ isScanning: false, isProcessing: false, result: null });
  };

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
              QR Code Scanner
            </CardTitle>
            <CardDescription>Position the QR code within the scanner area to verify the certificate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock Scanner Display */}
              <BarcodeScanner onCapture={(res) => console.log(res)} />

              {/* Control Button */}
              <Button
                onClick={scanState.result ? handleReset : handleStartScan}
                disabled={scanState.isScanning || scanState.isProcessing}
                className="w-full"
                variant={scanState.result ? "outline" : "default"}
              >
                {scanState.isScanning
                  ? "Scanning..."
                  : scanState.isProcessing
                    ? "Verifying..."
                    : scanState.result
                      ? "Scan Another"
                      : "Start Scanning"}
              </Button>
            </div>
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
                <Alert className={scanState.result.success ? "border-green-500" : "border-destructive"}>
                  <div className="flex items-center gap-2">
                    {scanState.result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription>
                      {scanState.result.success
                        ? "Certificate verified successfully!"
                        : scanState.result.error || "Verification failed"}
                    </AlertDescription>
                  </div>
                </Alert>

                {scanState.result.success && scanState.result.certificate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Certificate Details</h3>
                      <Badge variant="secondary" className="bg-green-50 text-green-600">
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
                        <span className="col-span-2 text-sm">{scanState.result.certificate.university}</span>
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
                        <span className="col-span-2 text-sm">
                          {new Date(scanState.result.certificate.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Issuer:</span>
                        <span className="col-span-2 font-mono text-sm text-xs">
                          {scanState.result.certificate.issuerAddress}
                        </span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground text-sm">Hash:</span>
                        <span className="col-span-2 font-mono text-sm text-xs">
                          {scanState.result.certificate.verificationHash}
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
