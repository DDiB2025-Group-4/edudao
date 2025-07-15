import type { Address } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParsedCredential } from "@/types";

interface CredentialStore {
  credentials: Record<Address, ParsedCredential[]>;
  addCredential: (address: Address, credential: ParsedCredential) => void;
  removeCredential: (address: Address, tokenId: string) => void;
  getCredential: (tokenId: string) => ParsedCredential | undefined;
  clearAll: () => void;
}

export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set, get) => ({
      credentials: {},

      addCredential: (address, credential) => {
        set((state) => ({
          credentials: {
            ...state.credentials,
            [address]: [...(state.credentials[address] || []), credential],
          },
        }));
      },

      removeCredential: (address, tokenId) => {
        set((state) => ({
          credentials: {
            ...state.credentials,
            [address]: (state.credentials[address] ?? []).filter((cred) => cred.token.tokenId !== tokenId),
          },
        }));
      },

      getCredential: (tokenId) =>
        Object.values(get().credentials)
          .flat()
          .find((cred) => cred.token.tokenId === tokenId),

      clearAll: () => {
        set({ credentials: {} });
      },
    }),
    {
      name: "credential-storage-v2",
    },
  ),
);
