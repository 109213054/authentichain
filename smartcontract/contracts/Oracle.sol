// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MaticPriceOracle {
    struct PriceFeed {
        string currency;//貨幣的名稱
        AggregatorV3Interface priceFeed;//對應的 Chainlink 預言機地址
    }

    mapping(string => AggregatorV3Interface) public priceFeeds;
    address public owner;
    

    event TWDRateUpdated(int256 newRate);//當 TWD 匯率更新時發送
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;

        // ✅ 設置 Chainlink Price Feed 地址 (Polygon Mainnet)
        priceFeeds["USD"] = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0); // MATIC/USD
        priceFeeds["GBP"] = AggregatorV3Interface(0xa302a0B8a499fD0f00449df0a490DedE21105955); // MATIC/GBP
        priceFeeds["JPY"] = AggregatorV3Interface(0xD647a6fC9BC6402301583C91decC5989d8Bc382D); // MATIC/JPY
        
    }

    /// @notice 取得 MATIC 兌換特定貨幣的即時價格
    function getMaticPrice(string memory currency) public view returns (int256) {
        AggregatorV3Interface feed = priceFeeds[currency];
        require(address(feed) != address(0), "Unsupported currency");

        (, int256 price,,,) = feed.latestRoundData();
        return price;
    }

}