# Decentralized Marketplace Smart Contract System

A secure, transparent, and feature-rich decentralized marketplace built with Solidity that enables users to list, buy, and sell items on the blockchain.

## Features

### Core Functionality

- **Item Management**: List, update, and delete items with comprehensive attributes
- **Secure Transactions**: Built-in payment handling with platform fee mechanism
- **Seller Protection**: Only item owners can modify or delete their listings
- **Buyer Protection**: Automatic refunds for excess payments
- **Inventory Tracking**: Real-time quantity management and automatic deactivation
- **Purchase History**: Track buyer purchase history

### Advanced Features

- **Reporting System**: Generate sales analytics and seller statistics using the MarketplaceReporting library
- **Platform Fees**: Configurable platform fee percentage with owner withdrawal capability
- **Event Emission**: Comprehensive event logging for all significant actions
- **Access Control**: Ownable contract inheritance for administrative functions
- **Error Handling**: Custom errors for gas-efficient error management

## Smart Contract Architecture

### Contracts

1. **Ownable.sol** - Base contract providing ownership functionality
2. **Marketplace.sol** - Main marketplace contract with all core features
3. **MarketplaceReporting.sol** - Library for generating sales and analytics reports

### Key Data Structures

```solidity
struct Item {
    uint256 id;
    string name;
    string description;
    uint256 price;
    uint256 quantity;
    address seller;
    bool active;
    bytes32 category;
}
```

## Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run build
```

## Testing

The project includes a comprehensive test suite covering all functionality:

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm test
```

### Test Coverage

- Contract deployment and initialization
- Item listing with validation
- Item updates and deletions
- Purchase transactions with payment handling
- Seller and marketplace reporting
- Owner administrative functions
- Ownable inheritance features

All 29 tests pass successfully.

## Deployment

### Local Deployment

```bash
# Deploy to Hardhat local network
npm run deploy
```

### Custom Network Deployment

```bash
# Deploy to specific network
npx hardhat run scripts/deploy.js --network <network-name>
```

The deployment script will:
1. Deploy the Marketplace contract with a 5% platform fee
2. Display the deployed contract address
3. Show the contract owner address

## Interacting with the Contract

### Using the Interaction Script

```bash
# Run the demo interaction script
npm run interact <MARKETPLACE_ADDRESS>
```

This script demonstrates:
1. Listing an item
2. Retrieving item details
3. Purchasing items
4. Checking seller statistics
5. Viewing marketplace reports
6. Calculating average sale prices

### Manual Interaction

#### Listing an Item

```javascript
const tx = await marketplace.listItem(
  "Item Name",
  "Item Description",
  ethers.parseEther("1.0"), // Price in ETH
  10, // Quantity
  ethers.encodeBytes32String("Category")
);
await tx.wait();
```

#### Updating an Item

```javascript
await marketplace.updateItem(
  itemId,
  "New Name",
  "New Description",
  ethers.parseEther("2.0"),
  5
);
```

#### Buying an Item

```javascript
await marketplace.buyItem(itemId, quantity, {
  value: ethers.parseEther("2.0") // Total payment
});
```

#### Viewing Reports

```javascript
// Get seller statistics
const sellerStats = await marketplace.getSellerStats(sellerAddress);

// Get marketplace report
const report = await marketplace.getMarketplaceReport();

// Get average sale price
const avgPrice = await marketplace.getAverageSalePrice();
```

## Security Features

- **Custom Errors**: Gas-efficient error handling
- **Modifiers**: Validation for prices, quantities, ownership, and item existence
- **Reentrancy Protection**: Proper state updates before external calls
- **Access Control**: Only owners can perform administrative actions
- **Payment Validation**: Ensures sufficient payment before processing transactions

## Contract Functions

### Public Functions

- `listItem()` - List a new item for sale
- `updateItem()` - Update an existing item (owner only)
- `deleteItem()` - Deactivate an item (owner only)
- `buyItem()` - Purchase an item
- `getItem()` - Retrieve item details
- `getSellerItems()` - Get all items listed by a seller
- `getPurchaseHistory()` - Get buyer's purchase history
- `getSellerStats()` - Get seller statistics
- `getMarketplaceReport()` - Get overall marketplace statistics
- `getAverageSalePrice()` - Calculate average sale price

### Owner Functions

- `setPlatformFeePercent()` - Update platform fee percentage
- `withdrawPlatformFees()` - Withdraw accumulated platform fees
- `transferOwnership()` - Transfer contract ownership

## Events

- `ItemListed` - Emitted when a new item is listed
- `ItemUpdated` - Emitted when an item is updated
- `ItemDeleted` - Emitted when an item is deleted
- `ItemPurchased` - Emitted when an item is purchased
- `ItemDeactivated` - Emitted when an item quantity reaches zero
- `OwnershipTransferred` - Emitted when contract ownership changes

## Error Codes

- `Marketplace__InvalidPrice` - Price cannot be zero
- `Marketplace__InvalidQuantity` - Quantity cannot be zero
- `Marketplace__ItemNotFound` - Item does not exist
- `Marketplace__NotItemOwner` - Caller is not the item owner
- `Marketplace__ItemNotActive` - Item is not active
- `Marketplace__InsufficientQuantity` - Not enough items in stock
- `Marketplace__InsufficientPayment` - Payment amount is insufficient
- `Marketplace__CannotBuyOwnItem` - Seller cannot buy their own item
- `Marketplace__TransferFailed` - ETH transfer failed
- `Ownable__NotOwner` - Caller is not the contract owner
- `Ownable__InvalidAddress` - Address cannot be zero

## Gas Optimization

The contracts are optimized for gas efficiency:
- Custom errors instead of require strings
- Efficient storage patterns
- Optimized compiler settings (200 runs)
- Strategic use of memory vs storage

## Development

### Project Structure

```
project/
├── contracts/
│   ├── Ownable.sol
│   ├── Marketplace.sol
│   └── MarketplaceReporting.sol
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── Marketplace.test.js
├── hardhat.config.js
└── package.json
```

### Requirements

- Node.js v18 or higher
- Hardhat
- Ethers.js v6

## License

MIT
