const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async () => {
  let fundMe, deployer, mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1");
  //   console.log(sendValue.toString());
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all");
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });
  describe("constructor", async () => {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });
  describe("fund", async () => {
    it("Fails if you do not send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough eth");
    });
    // it("updated the amount funded data structure", async function () {
    //   await fundMe.fund({ value: sendValue });
    //   const response = await fundMe.addressToAmountFunded(deployer);
    //   assert.equal(response.toString(), sendValue.toString());
    // });
    it("get price feed", async () => {
      const response = await fundMe.getPriceFeed();
      console.log(response);
    });
    it("Adds funder to the array of funders", async () => {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });
});
