import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Credential } from "@/types";

export interface ParsedCredential extends Credential {
  parsedData: {
    address: string;
    university: string;
    issuerAddress: string;
    tokenAddress: string;
    tokenId: string;
    name?: string;
    degreeLevel?: string;
    graduationYear?: string;
    faculty?: string;
    thumbnail: string;
  };
}

interface CredentialStore {
  credentials: ParsedCredential[];
  addCredential: (credential: Credential) => void;
  removeCredential: (tokenId: string) => void;
  getCredential: (tokenId: string) => ParsedCredential | undefined;
  clearAll: () => void;
}

// Mock function to parse SD-JWT (replace with actual implementation)
const parseSdJwt = (sdjwt: string): ParsedCredential["parsedData"] => {
  // This is a mock implementation - replace with actual SD-JWT parsing
  const mockData = {
    address: "0x1234567890123456789012345678901234567890",
    university: "Sample University",
    issuerAddress: "0x0987654321098765432109876543210987654321",
    tokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    tokenId: "123456789",
    name: "John Doe",
    degreeLevel: "Bachelor's Degree",
    graduationYear: "2024",
    faculty: "Engineering",
    thumbnail: `https://picsum.photos/seed/${sdjwt.slice(0, 10)}/400/300`, // Mock thumbnail
  };

  return mockData;
};

export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set, get) => ({
      credentials: [],

      addCredential: (credential) => {
        const parsedData = parseSdJwt(credential.sdjwt);
        const parsedCredential: ParsedCredential = {
          ...credential,
          parsedData,
        };

        set((state) => ({
          credentials: [...state.credentials, parsedCredential],
        }));
      },

      removeCredential: (tokenId) => {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.token.tokenId !== tokenId),
        }));
      },

      getCredential: (tokenId) => {
        return get().credentials.find((cred) => cred.token.tokenId === tokenId);
      },

      clearAll: () => {
        set({ credentials: [] });
      },
    }),
    {
      name: "credential-storage",
    },
  ),
);
