export interface Credential {
  token: {
    chainId: number;
    tokenId: string;
    address: string;
  };
  sdjwt: string;
}
