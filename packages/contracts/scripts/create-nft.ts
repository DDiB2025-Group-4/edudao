import hre from "hardhat";
import DeployAll from "../ignition/modules/DeployAll";

const args = {
  name: "DDiB2025 Group4 Member NFT",
  symbol: "DDiB25G4",
};

async function main() {
  const { control } = await hre.ignition.deploy(DeployAll);
  const accounts = await hre.viem.getWalletClients();
  await control.write.createEduNft([accounts[0].account.address, args.name, args.symbol]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
