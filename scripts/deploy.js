const hre = require("hardhat");

async function main() {
  const PLATFORM_FEE_PERCENT = 5;

  console.log("Deploying Marketplace contract...");
  console.log("Platform fee:", PLATFORM_FEE_PERCENT + "%");

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(PLATFORM_FEE_PERCENT);

  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("Marketplace deployed to:", address);
  console.log("Owner:", await marketplace.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
