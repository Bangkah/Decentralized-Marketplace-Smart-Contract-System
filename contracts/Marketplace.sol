// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownable.sol";
import "./MarketplaceReporting.sol";

error Marketplace__InvalidPrice();
error Marketplace__InvalidQuantity();
error Marketplace__ItemNotFound();
error Marketplace__NotItemOwner();
error Marketplace__ItemNotActive();
error Marketplace__InsufficientQuantity();
error Marketplace__InsufficientPayment();
error Marketplace__CannotBuyOwnItem();
error Marketplace__TransferFailed();

contract Marketplace is Ownable {
    using MarketplaceReporting for *;

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

    struct SellerStats {
        uint256 itemsListed;
        uint256 itemsSold;
        uint256 totalRevenue;
    }

    uint256 private _nextItemId;
    uint256 private _totalSales;
    uint256 private _totalRevenue;
    uint256 private _platformFeePercent;

    mapping(uint256 => Item) private _items;
    mapping(address => uint256[]) private _sellerItems;
    mapping(address => SellerStats) private _sellerStats;
    mapping(address => uint256[]) private _purchaseHistory;

    event ItemListed(
        uint256 indexed itemId,
        address indexed seller,
        string name,
        uint256 price,
        uint256 quantity
    );

    event ItemUpdated(
        uint256 indexed itemId,
        string name,
        uint256 price,
        uint256 quantity
    );

    event ItemDeleted(uint256 indexed itemId, address indexed seller);

    event ItemPurchased(
        uint256 indexed itemId,
        address indexed buyer,
        address indexed seller,
        uint256 quantity,
        uint256 totalPrice
    );

    event ItemDeactivated(uint256 indexed itemId);

    modifier validPrice(uint256 price) {
        if (price == 0) {
            revert Marketplace__InvalidPrice();
        }
        _;
    }

    modifier validQuantity(uint256 quantity) {
        if (quantity == 0) {
            revert Marketplace__InvalidQuantity();
        }
        _;
    }

    modifier itemExists(uint256 itemId) {
        if (_items[itemId].seller == address(0)) {
            revert Marketplace__ItemNotFound();
        }
        _;
    }

    modifier onlyItemOwner(uint256 itemId) {
        if (_items[itemId].seller != msg.sender) {
            revert Marketplace__NotItemOwner();
        }
        _;
    }

    constructor(uint256 platformFeePercent) {
        _platformFeePercent = platformFeePercent;
        _nextItemId = 1;
    }

    function listItem(
        string memory name,
        string memory description,
        uint256 price,
        uint256 quantity,
        bytes32 category
    ) external validPrice(price) validQuantity(quantity) returns (uint256) {
        uint256 itemId = _nextItemId++;

        _items[itemId] = Item({
            id: itemId,
            name: name,
            description: description,
            price: price,
            quantity: quantity,
            seller: msg.sender,
            active: true,
            category: category
        });

        _sellerItems[msg.sender].push(itemId);
        _sellerStats[msg.sender].itemsListed++;

        emit ItemListed(itemId, msg.sender, name, price, quantity);

        return itemId;
    }

    function updateItem(
        uint256 itemId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 quantity
    )
        external
        itemExists(itemId)
        onlyItemOwner(itemId)
        validPrice(price)
        validQuantity(quantity)
    {
        Item storage item = _items[itemId];
        item.name = name;
        item.description = description;
        item.price = price;
        item.quantity = quantity;

        emit ItemUpdated(itemId, name, price, quantity);
    }

    function deleteItem(uint256 itemId)
        external
        itemExists(itemId)
        onlyItemOwner(itemId)
    {
        _items[itemId].active = false;

        emit ItemDeleted(itemId, msg.sender);
    }

    function buyItem(uint256 itemId, uint256 quantity)
        external
        payable
        itemExists(itemId)
        validQuantity(quantity)
    {
        Item storage item = _items[itemId];

        if (!item.active) {
            revert Marketplace__ItemNotActive();
        }

        if (item.seller == msg.sender) {
            revert Marketplace__CannotBuyOwnItem();
        }

        if (item.quantity < quantity) {
            revert Marketplace__InsufficientQuantity();
        }

        uint256 totalPrice = item.price * quantity;
        if (msg.value < totalPrice) {
            revert Marketplace__InsufficientPayment();
        }

        item.quantity -= quantity;
        if (item.quantity == 0) {
            item.active = false;
            emit ItemDeactivated(itemId);
        }

        uint256 platformFee = (totalPrice * _platformFeePercent) / 100;
        uint256 sellerAmount = totalPrice - platformFee;

        _sellerStats[item.seller].itemsSold += quantity;
        _sellerStats[item.seller].totalRevenue += sellerAmount;
        _totalSales += quantity;
        _totalRevenue += totalPrice;

        _purchaseHistory[msg.sender].push(itemId);

        (bool success, ) = payable(item.seller).call{value: sellerAmount}("");
        if (!success) {
            revert Marketplace__TransferFailed();
        }

        if (msg.value > totalPrice) {
            uint256 refund = msg.value - totalPrice;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            if (!refundSuccess) {
                revert Marketplace__TransferFailed();
            }
        }

        emit ItemPurchased(itemId, msg.sender, item.seller, quantity, totalPrice);
    }

    function getItem(uint256 itemId)
        external
        view
        itemExists(itemId)
        returns (Item memory)
    {
        return _items[itemId];
    }

    function getSellerItems(address seller)
        external
        view
        returns (uint256[] memory)
    {
        return _sellerItems[seller];
    }

    function getPurchaseHistory(address buyer)
        external
        view
        returns (uint256[] memory)
    {
        return _purchaseHistory[buyer];
    }

    function getSellerStats(address seller)
        external
        view
        returns (MarketplaceReporting.SellerReport memory)
    {
        SellerStats memory stats = _sellerStats[seller];
        return MarketplaceReporting.generateSellerReport(
            stats.itemsListed,
            stats.itemsSold,
            stats.totalRevenue
        );
    }

    function getMarketplaceReport()
        external
        view
        returns (MarketplaceReporting.SalesReport memory)
    {
        uint256 activeListings = 0;
        for (uint256 i = 1; i < _nextItemId; i++) {
            if (_items[i].active && _items[i].quantity > 0) {
                activeListings++;
            }
        }

        return MarketplaceReporting.generateSalesReport(
            _totalSales,
            _totalRevenue,
            _nextItemId - 1,
            activeListings
        );
    }

    function getAverageSalePrice() external view returns (uint256) {
        return MarketplaceReporting.calculateAveragePrice(_totalRevenue, _totalSales);
    }

    function getPlatformFeePercent() external view returns (uint256) {
        return _platformFeePercent;
    }

    function setPlatformFeePercent(uint256 newFeePercent) external onlyOwner {
        _platformFeePercent = newFeePercent;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) {
            revert Marketplace__TransferFailed();
        }
    }
}
