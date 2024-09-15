// 00_deploy_your_contract.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployVotingSystem: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const candidateNames = ["Cats", "Dogs"];

  await deploy("VotingSystem", {
    from: deployer,
    args: [candidateNames],
    log: true,
  });
};

export default deployVotingSystem;
deployVotingSystem.tags = ["VotingSystem"];
