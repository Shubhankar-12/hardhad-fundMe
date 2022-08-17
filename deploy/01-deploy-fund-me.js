const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  //   const ethUSDPriceFeed = networkConfig[chainId]["ethUSDPriceFeed"];
  let ethUSDPriceFeed;
  if (developmentChains.includes(network.name)) {
    const ethUSDAggregator = await deployments.get("MockV3Aggregator");
    ethUSDPriceFeed = ethUSDAggregator.address;
  } else {
    ethUSDPriceFeed = networkConfig[chainId]["ethUSDPriceFeed"];
  }
  let args = [ethUSDPriceFeed];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("--------------------------------------------");
  if (!developmentChains.includes(network.name)) {
    await verify(fundMe.address, args);
  }
};
module.exports.tags = ["all", "fundme"];
