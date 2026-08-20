import hre from "hardhat";

async function main() {
    const factory = await ethers.getContractFactory("Forum");
    const counter = await factory.deploy();

    await counter.waitForDeployment();

    console.log("Contract address: ", await counter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});