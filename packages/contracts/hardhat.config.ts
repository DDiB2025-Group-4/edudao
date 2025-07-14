import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    opSepolia: process.env.PRIVATE_KEY
      ? {
          url: "https://sepolia.optimism.io",
          accounts: [`0x${process.env.PRIVATE_KEY as string}`],
        }
      : undefined,
  },
  etherscan: {
    apiKey: {
      opSepolia: "empty",
    },
    customChains: [
      {
        network: "opSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://optimism-sepolia.blockscout.com/api",
          browserURL: "https://optimism-sepolia.blockscout.com",
        },
      },
    ],
  },
};

export default config;
