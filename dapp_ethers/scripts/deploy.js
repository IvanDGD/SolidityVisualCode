import hre from "hardhat";

async function main() {
    const factory = await ethers.getContractFactory("Store");
    const store = await factory.deploy();

    await store.waitForDeployment();

    console.log("Contract address: ", await store.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});