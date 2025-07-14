import { type Address, erc721Abi } from "viem";
import { useReadContracts } from "wagmi";

export const useNftsMetadata = (addresses: Address[]) => {
  const query = useReadContracts({
    contracts: addresses.map((address) => ({
      address,
      abi: erc721Abi,
      functionName: "name",
    })),
  });

  return query;
};
