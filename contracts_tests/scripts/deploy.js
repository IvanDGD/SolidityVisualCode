const { ethers } = require("hardhat");

(async() => {
    const factory = await ethers.getContractFactory("GrandmotherGifts");
    const grandmaGifts = await factory.deploy();

    await grandmaGifts.waitForDeployment();

    console.log("Contract address: ", await grandmaGifts.getAddress());
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})