const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GrandmotherGifts", function () {
  async function deployGrandmotherGiftsFixture() {
    const [grandma, grandchild1, grandchild2, stranger] = await ethers.getSigners();

    const GrandmotherGifts = await ethers.getContractFactory("GrandmotherGifts");
    const contract = await GrandmotherGifts.deploy();

    return { contract, grandma, grandchild1, grandchild2, stranger };
  }

  describe("Deployment", function () {
    it("Should set the correct grandma owner", async function () {
      const { contract, grandma } = await loadFixture(deployGrandmotherGiftsFixture);

      expect(await contract.grandma()).to.equal(grandma.address);
    });
  });

  describe("addGrandchild", function () {
    it("Should allow grandma to add a grandchild", async function () {
      const { contract, grandma, grandchild1 } = await loadFixture(deployGrandmotherGiftsFixture);

      const latestBlock = await ethers.provider.getBlock("latest");
      const birthday = latestBlock.timestamp + 3600;

      await contract.connect(grandma).addGrandchild(grandchild1.address, birthday);

      expect(await contract.birthdays(grandchild1.address)).to.equal(birthday);
    });

    it("Should revert if non-grandma tries to add a grandchild", async function () {
      const { contract, grandchild1, stranger } = await loadFixture(deployGrandmotherGiftsFixture);

      await expect(
        contract.connect(stranger).addGrandchild(grandchild1.address, 1000)
      ).to.be.revertedWith("Only grandma");
    });
  });

  describe("deposit", function () {
    it("Should allow grandma to deposit ETH and set gift amount", async function () {
      const { contract, grandma } = await loadFixture(deployGrandmotherGiftsFixture);
      const giftAmount = ethers.parseEther("1.0");

      await contract.connect(grandma).deposit(giftAmount, { value: giftAmount });

      expect(await contract.giftAmount()).to.equal(giftAmount);
      expect(await ethers.provider.getBalance(await contract.getAddress())).to.equal(giftAmount);
    });

    it("Should revert if non-grandma tries to deposit", async function () {
      const { contract, stranger } = await loadFixture(deployGrandmotherGiftsFixture);
      const giftAmount = ethers.parseEther("1.0");

      await expect(
        contract.connect(stranger).deposit(giftAmount, { value: giftAmount })
      ).to.be.revertedWith("Only grandma");
    });
  });

  describe("claimGift", function () {
    async function deployWithDepositFixture() {
      const base = await deployGrandmotherGiftsFixture();
      const giftAmount = ethers.parseEther("1.0");

      await base.contract.connect(base.grandma).deposit(giftAmount, { value: giftAmount * 2n });

      return { ...base, giftAmount };
    }

    it("Should revert if caller is not a registered grandchild", async function () {
      const { contract, stranger } = await loadFixture(deployWithDepositFixture);

      await expect(contract.connect(stranger).claimGift()).to.be.revertedWith(
        "Not a grandchild"
      );
    });

    it("Should revert if birthday has not come yet", async function () {
      const { contract, grandma, grandchild1 } = await loadFixture(deployWithDepositFixture);

      const latestBlock = await ethers.provider.getBlock("latest");
      const futureBirthday = latestBlock.timestamp + 10000;

      await contract.connect(grandma).addGrandchild(grandchild1.address, futureBirthday);

      await expect(contract.connect(grandchild1).claimGift()).to.be.revertedWith(
        "Birthday has not come yet"
      );
    });

    it("Should revert if contract balance is lower than giftAmount", async function () {
      const { contract, grandma, grandchild1 } = await loadFixture(deployGrandmotherGiftsFixture);

      const latestBlock = await ethers.provider.getBlock("latest");
      const pastBirthday = latestBlock.timestamp - 1000;
      const hugeGiftAmount = ethers.parseEther("10.0");

      await contract.connect(grandma).deposit(hugeGiftAmount, { value: ethers.parseEther("1.0") });
      await contract.connect(grandma).addGrandchild(grandchild1.address, pastBirthday);

      await expect(contract.connect(grandchild1).claimGift()).to.be.revertedWith(
        "Not enough ETH in contract"
      );
    });

    it("Should allow grandchild to claim gift on or after birthday", async function () {
      const { contract, grandma, grandchild1, giftAmount } = await loadFixture(deployWithDepositFixture);

      const latestBlock = await ethers.provider.getBlock("latest");
      const birthday = latestBlock.timestamp + 1000;

      await contract.connect(grandma).addGrandchild(grandchild1.address, birthday);

      await ethers.provider.send("evm_mine", [birthday]);

      await expect(
        contract.connect(grandchild1).claimGift()
      ).to.changeEtherBalances(
        [contract, grandchild1],
        [-giftAmount, giftAmount]
      );

      expect(await contract.hasClaimed(grandchild1.address)).to.be.true;
    });

    it("Should revert if grandchild tries to claim twice", async function () {
      const { contract, grandma, grandchild1 } = await loadFixture(deployWithDepositFixture);

      const latestBlock = await ethers.provider.getBlock("latest");
      const pastBirthday = latestBlock.timestamp - 1000;

      await contract.connect(grandma).addGrandchild(grandchild1.address, pastBirthday);

      await contract.connect(grandchild1).claimGift();

      await expect(contract.connect(grandchild1).claimGift()).to.be.revertedWith(
        "Already claimed"
      );
    });
  });
});