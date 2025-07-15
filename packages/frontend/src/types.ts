import type { Address } from "viem";

export interface Credential {
  issuerAddress: Address;
  token: {
    chainId: number;
    tokenId: string;
    address: string;
  };
  sdjwt: string;
}
export interface ParsedCredential extends Credential {
  claims: {
    address: string;
    university: string;
    issuerAddress: string;
    tokenAddress: string;
    tokenId: string;
    name: string;
    degreeLevel: string;
    graduationYear: string;
    faculty: string;
  };
  additional: {
    thumbnailUri?: string;
    thumbnailHttps?: string;
  };
}
