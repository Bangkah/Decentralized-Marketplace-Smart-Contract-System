const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let marketplace;
  let owner;
  let seller;
  let buyer;
  let otherAccount;
  const PLATFORM_FEE = 5;

  beforeEach(async function () {
    [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(PLATFORM_FEE);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await marketplace.getPlatformFeePercent()).to.equal(PLATFORM_FEE);
    });
  });

  describe("Item Listing", function () {
    it("Should list an item successfully", async function () {
      const tx = await marketplace.connect(seller).listItem(
        "Test Item",
        "Test Description",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );

      await expect(tx)
        .to.emit(marketplace, "ItemListed")
        .withArgs(1, seller.address, "Test Item", ethers.parseEther("1"), 10);

      const item = await marketplace.getItem(1);
      expect(item.name).to.equal("Test Item");
      expect(item.description).to.equal("Test Description");
      expect(item.price).to.equal(ethers.parseEther("1"));
      expect(item.quantity).to.equal(10);
      expect(item.seller).to.equal(seller.address);
      expect(item.active).to.equal(true);
    });

    it("Should revert when listing with zero price", async function () {
      await expect(
        marketplace.connect(seller).listItem(
          "Test Item",
          "Test Description",
          0,
          10,
          ethers.encodeBytes32String("Electronics")
        )
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__InvalidPrice");
    });

    it("Should revert when listing with zero quantity", async function () {
      await expect(
        marketplace.connect(seller).listItem(
          "Test Item",
          "Test Description",
          ethers.parseEther("1"),
          0,
          ethers.encodeBytes32String("Electronics")
        )
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__InvalidQuantity");
    });

    it("Should track seller items", async function () {
      await marketplace.connect(seller).listItem(
        "Item 1",
        "Description 1",
        ethers.parseEther("1"),
        5,
        ethers.encodeBytes32String("Electronics")
      );

      await marketplace.connect(seller).listItem(
        "Item 2",
        "Description 2",
        ethers.parseEther("2"),
        3,
        ethers.encodeBytes32String("Books")
      );

      const sellerItems = await marketplace.getSellerItems(seller.address);
      expect(sellerItems.length).to.equal(2);
      expect(sellerItems[0]).to.equal(1);
      expect(sellerItems[1]).to.equal(2);
    });
  });

  describe("Item Update", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(
        "Original Item",
        "Original Description",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );
    });

    it("Should update item successfully", async function () {
      const tx = await marketplace.connect(seller).updateItem(
        1,
        "Updated Item",
        "Updated Description",
        ethers.parseEther("2"),
        5
      );

      await expect(tx)
        .to.emit(marketplace, "ItemUpdated")
        .withArgs(1, "Updated Item", ethers.parseEther("2"), 5);

      const item = await marketplace.getItem(1);
      expect(item.name).to.equal("Updated Item");
      expect(item.description).to.equal("Updated Description");
      expect(item.price).to.equal(ethers.parseEther("2"));
      expect(item.quantity).to.equal(5);
    });

    it("Should revert when non-owner tries to update", async function () {
      await expect(
        marketplace.connect(buyer).updateItem(
          1,
          "Updated Item",
          "Updated Description",
          ethers.parseEther("2"),
          5
        )
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__NotItemOwner");
    });

    it("Should revert when updating non-existent item", async function () {
      await expect(
        marketplace.connect(seller).updateItem(
          999,
          "Updated Item",
          "Updated Description",
          ethers.parseEther("2"),
          5
        )
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__ItemNotFound");
    });
  });

  describe("Item Deletion", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(
        "Test Item",
        "Test Description",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );
    });

    it("Should delete item successfully", async function () {
      const tx = await marketplace.connect(seller).deleteItem(1);

      await expect(tx)
        .to.emit(marketplace, "ItemDeleted")
        .withArgs(1, seller.address);

      const item = await marketplace.getItem(1);
      expect(item.active).to.equal(false);
    });

    it("Should revert when non-owner tries to delete", async function () {
      await expect(
        marketplace.connect(buyer).deleteItem(1)
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__NotItemOwner");
    });
  });

  describe("Item Purchase", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(
        "Test Item",
        "Test Description",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );
    });

    it("Should purchase item successfully", async function () {
      const itemPrice = ethers.parseEther("1");
      const quantity = 2;
      const totalPrice = itemPrice * BigInt(quantity);
      const platformFee = (totalPrice * BigInt(PLATFORM_FEE)) / BigInt(100);
      const sellerAmount = totalPrice - platformFee;

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      const tx = await marketplace.connect(buyer).buyItem(1, quantity, {
        value: totalPrice
      });

      await expect(tx)
        .to.emit(marketplace, "ItemPurchased")
        .withArgs(1, buyer.address, seller.address, quantity, totalPrice);

      const item = await marketplace.getItem(1);
      expect(item.quantity).to.equal(8);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);

      const purchaseHistory = await marketplace.getPurchaseHistory(buyer.address);
      expect(purchaseHistory.length).to.equal(1);
      expect(purchaseHistory[0]).to.equal(1);
    });

    it("Should deactivate item when quantity reaches zero", async function () {
      const itemPrice = ethers.parseEther("1");
      const quantity = 10;
      const totalPrice = itemPrice * BigInt(quantity);

      const tx = await marketplace.connect(buyer).buyItem(1, quantity, {
        value: totalPrice
      });

      await expect(tx).to.emit(marketplace, "ItemDeactivated").withArgs(1);

      const item = await marketplace.getItem(1);
      expect(item.active).to.equal(false);
      expect(item.quantity).to.equal(0);
    });

    it("Should refund excess payment", async function () {
      const itemPrice = ethers.parseEther("1");
      const quantity = 1;
      const totalPrice = itemPrice * BigInt(quantity);
      const excessPayment = ethers.parseEther("0.5");

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyItem(1, quantity, {
        value: totalPrice + excessPayment
      });

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const expectedBalance = buyerBalanceBefore - totalPrice - gasUsed;

      expect(buyerBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });

    it("Should revert when buying with insufficient payment", async function () {
      await expect(
        marketplace.connect(buyer).buyItem(1, 2, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__InsufficientPayment");
    });

    it("Should revert when buying own item", async function () {
      await expect(
        marketplace.connect(seller).buyItem(1, 1, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__CannotBuyOwnItem");
    });

    it("Should revert when buying inactive item", async function () {
      await marketplace.connect(seller).deleteItem(1);

      await expect(
        marketplace.connect(buyer).buyItem(1, 1, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__ItemNotActive");
    });

    it("Should revert when quantity exceeds available", async function () {
      await expect(
        marketplace.connect(buyer).buyItem(1, 100, {
          value: ethers.parseEther("100")
        })
      ).to.be.revertedWithCustomError(marketplace, "Marketplace__InsufficientQuantity");
    });
  });

  describe("Reporting", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listItem(
        "Item 1",
        "Description 1",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );

      await marketplace.connect(seller).listItem(
        "Item 2",
        "Description 2",
        ethers.parseEther("2"),
        5,
        ethers.encodeBytes32String("Books")
      );

      await marketplace.connect(buyer).buyItem(1, 3, {
        value: ethers.parseEther("3")
      });
    });

    it("Should generate correct seller report", async function () {
      const report = await marketplace.getSellerStats(seller.address);

      expect(report.itemsListed).to.equal(2);
      expect(report.itemsSold).to.equal(3);

      const expectedRevenue = ethers.parseEther("3") * BigInt(95) / BigInt(100);
      expect(report.totalRevenue).to.equal(expectedRevenue);
    });

    it("Should generate correct marketplace report", async function () {
      const report = await marketplace.getMarketplaceReport();

      expect(report.totalSales).to.equal(3);
      expect(report.totalRevenue).to.equal(ethers.parseEther("3"));
      expect(report.totalItemsListed).to.equal(2);
      expect(report.activeListings).to.equal(2);
    });

    it("Should calculate average sale price correctly", async function () {
      const avgPrice = await marketplace.getAverageSalePrice();
      expect(avgPrice).to.equal(ethers.parseEther("1"));
    });

    it("Should return zero average price when no sales", async function () {
      const Marketplace = await ethers.getContractFactory("Marketplace");
      const newMarketplace = await Marketplace.deploy(PLATFORM_FEE);

      const avgPrice = await newMarketplace.getAverageSalePrice();
      expect(avgPrice).to.equal(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await marketplace.connect(owner).setPlatformFeePercent(10);
      expect(await marketplace.getPlatformFeePercent()).to.equal(10);
    });

    it("Should revert when non-owner tries to update platform fee", async function () {
      await expect(
        marketplace.connect(seller).setPlatformFeePercent(10)
      ).to.be.revertedWithCustomError(marketplace, "Ownable__NotOwner");
    });

    it("Should allow owner to withdraw platform fees", async function () {
      await marketplace.connect(seller).listItem(
        "Test Item",
        "Test Description",
        ethers.parseEther("1"),
        10,
        ethers.encodeBytes32String("Electronics")
      );

      await marketplace.connect(buyer).buyItem(1, 1, {
        value: ethers.parseEther("1")
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(marketplace.target);

      const tx = await marketplace.connect(owner).withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      const expectedBalance = ownerBalanceBefore + contractBalance - gasUsed;

      expect(ownerBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });

    it("Should revert when non-owner tries to withdraw fees", async function () {
      await expect(
        marketplace.connect(seller).withdrawPlatformFees()
      ).to.be.revertedWithCustomError(marketplace, "Ownable__NotOwner");
    });
  });

  describe("Ownable Inheritance", function () {
    it("Should allow owner to transfer ownership", async function () {
      await marketplace.connect(owner).transferOwnership(otherAccount.address);
      expect(await marketplace.owner()).to.equal(otherAccount.address);
    });

    it("Should revert when transferring to zero address", async function () {
      await expect(
        marketplace.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "Ownable__InvalidAddress");
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(marketplace.connect(owner).transferOwnership(otherAccount.address))
        .to.emit(marketplace, "OwnershipTransferred")
        .withArgs(owner.address, otherAccount.address);
    });
  });
});
