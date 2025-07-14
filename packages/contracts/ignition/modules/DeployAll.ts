// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployAll = buildModule("DeployAllModule", (m) => {
  const nftImpl = m.contract("EduNFT", []);
  const controlImpl = m.contract("EduControl", []);

  const controlCalldata = m.encodeFunctionCall(controlImpl, "initialize", [m.getAccount(0), nftImpl]);

  const proxy = m.contract("TransparentUpgradeableProxy", [controlImpl, m.getAccount(0), controlCalldata]);

  return { proxy, nftImpl };
});

const WrapperModule = buildModule("WrapperModule", (m) => {
  const { proxy, nftImpl } = m.useModule(DeployAll);

  const control = m.contractAt("EduControl", proxy);

  return { proxy, control, nftImpl };
});

export default WrapperModule;
