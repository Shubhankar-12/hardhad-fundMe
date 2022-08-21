const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all");
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });
      describe("constructor", async () => {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.s_priceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });
      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.s_addressToamountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to the array of funders", async () => {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.s_funders(0);
          assert.equal(funder, deployer);
        });
      });

      describe("cheaper withdraw testing...", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("can withdraw ETH from a single funder", async () => {
          // Arrange
          const strartingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const strartingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionRecipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionRecipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            strartingFundMeBalance.add(strartingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });
        it("is allows us to withdraw with multiple s_funders", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          // Let's comapre gas costs :)
          // const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
          console.log(`GasCost: ${withdrawGasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${effectiveGasPrice}`);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(withdrawGasCost).toString()
          );
          // Make a getter for storage variables
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.s_addressToamountFunded(accounts[i].address),
              0
            );
          }
        });
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[2]);
          await expect(
            fundMeConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(
            fundMeConnectedContract,
            "FundMe__NotOwner"
          );
        });
      });
    });
