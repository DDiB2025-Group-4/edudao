export interface Credential {
  issuerAddress: string;
  token: {
    chainId: number;
    tokenId: string;
    address: string;
  };
  sdjwt: string;
}
