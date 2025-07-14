import { useQuery } from "@tanstack/react-query";
import { isAddress, isHex, slice } from "viem";
import type { UseAccountReturnType } from "wagmi";
import { CONTROL_ADDRESSES, THIRDWEBCLIENT_ID } from "@/constants";

const constructQueryUrl = (chainId: number, address: string) => {
  return `https://insight.thirdweb.com/v1/events/${CONTROL_ADDRESSES[chainId]}/NewEduNftCreated(address,address)?chain_id=${chainId}&filter_topic_1=${address}&limit=200&clientId=${THIRDWEBCLIENT_ID}`;
};

interface InsightResponse {
  meta: unknown;
  data: {
    topics: string[];
  }[];
}

export const useOwnEduNfts = (account: UseAccountReturnType) => {
  const query = useQuery({
    queryKey: ["ownEduNfts", account.address],
    queryFn: async () => {
      if (!account.address) return [];
      const chainId = account.chain?.id || 11155420; // Default to 11155420 if chainId is not available
      const url = constructQueryUrl(chainId, account.address);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch own Edu NFTs");

      const data = (await response.json()) as InsightResponse;
      const nftAddresses = data.data
        .map((item) => {
          const topic = item.topics[2];
          if (!topic || !isHex(topic)) return null;
          return slice(topic, 12, 32);
        })
        .filter((address) => !!address && isAddress(address));

      return nftAddresses; // Repeat the addresses for some reason
    },
    enabled: !!account.address,
  });

  return query;
};
