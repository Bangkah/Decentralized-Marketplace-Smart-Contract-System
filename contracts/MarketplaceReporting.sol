// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MarketplaceReporting {
    struct SalesReport {
        uint256 totalSales;
        uint256 totalRevenue;
        uint256 totalItemsListed;
        uint256 activeListings;
    }

    struct SellerReport {
        uint256 itemsListed;
        uint256 itemsSold;
        uint256 totalRevenue;
    }

    function generateSalesReport(
        uint256 totalSales,
        uint256 totalRevenue,
        uint256 totalItemsListed,
        uint256 activeListings
    ) internal pure returns (SalesReport memory) {
        return SalesReport({
            totalSales: totalSales,
            totalRevenue: totalRevenue,
            totalItemsListed: totalItemsListed,
            activeListings: activeListings
        });
    }

    function generateSellerReport(
        uint256 itemsListed,
        uint256 itemsSold,
        uint256 totalRevenue
    ) internal pure returns (SellerReport memory) {
        return SellerReport({
            itemsListed: itemsListed,
            itemsSold: itemsSold,
            totalRevenue: totalRevenue
        });
    }

    function calculateAveragePrice(
        uint256 totalRevenue,
        uint256 totalSales
    ) internal pure returns (uint256) {
        if (totalSales == 0) return 0;
        return totalRevenue / totalSales;
    }
}
