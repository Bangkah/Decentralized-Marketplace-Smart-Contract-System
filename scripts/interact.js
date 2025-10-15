const hre = require("hardhat");

async function main() {
  const marketplaceAddress = process.argv[2];

  if (!marketplaceAddress) {
    console.error("Please provide the marketplace contract address as an argument");
    process.exit(1);
  }

  const [owner, seller, buyer] = await hre.ethers.getSigners();

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = Marketplace.attach(marketplaceAddress);

  console.log("\n=== Marketplace Interaction Demo ===\n");

  console.log("1. Listing an item...");
  const listTx = await marketplace.connect(seller).listItem(
    "Gaming Laptop",
    "High-performance laptop for gaming",
    hre.ethers.parseEther("1.5"),
    5,
    hre.ethers.encodeBytes32String("Electronics")
  );
  await listTx.wait();
  console.log("   Item listed successfully!");

  console.log("\n2. Getting item details...");
  const item = await marketplace.getItem(1);
  console.log("   Name:", item.name);
  console.log("   Description:", item.description);
  console.log("   Price:", hre.ethers.formatEther(item.price), "ETH");
  console.log("   Quantity:", item.quantity.toString());
  console.log("   Seller:", item.seller);

  console.log("\n3. Buyer purchasing item...");
  const buyTx = await marketplace.connect(buyer).buyItem(1, 2, {
    value: hre.ethers.parseEther("3.0")
  });
  await buyTx.wait();
  console.log("   Purchase successful!");

  console.log("\n4. Checking updated item details...");
  const updatedItem = await marketplace.getItem(1);
  console.log("   Remaining quantity:", updatedItem.quantity.toString());

  console.log("\n5. Getting seller statistics...");
  const sellerStats = await marketplace.getSellerStats(seller.address);
  console.log("   Items listed:", sellerStats.itemsListed.toString());
  console.log("   Items sold:", sellerStats.itemsSold.toString());
  console.log("   Total revenue:", hre.ethers.formatEther(sellerStats.totalRevenue), "ETH");

  console.log("\n6. Getting marketplace report...");
  const report = await marketplace.getMarketplaceReport();
  console.log("   Total sales:", report.totalSales.toString());
  console.log("   Total revenue:", hre.ethers.formatEther(report.totalRevenue), "ETH");
  console.log("   Total items listed:", report.totalItemsListed.toString());
  console.log("   Active listings:", report.activeListings.toString());

  console.log("\n7. Getting average sale price...");
  const avgPrice = await marketplace.getAverageSalePrice();
  console.log("   Average price:", hre.ethers.formatEther(avgPrice), "ETH");

  console.log("\n=== Demo Complete ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
