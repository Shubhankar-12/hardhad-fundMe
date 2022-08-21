// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter{
    
    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint256) {
        // ABI
        // Address 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        (,int256 answer,,,)=priceFeed.latestRoundData();
        return uint256(answer * 10**10);
    }
    function getVersion(AggregatorV3Interface priceFeed) internal view returns(uint256){
        return priceFeed.version();
    }

    function getConversionRate(uint256 ethAmount,AggregatorV3Interface priceFeed) internal view returns(uint256){
        uint256 ethPrice=getPrice(priceFeed);
        uint256 ethInUSD=(ethPrice*ethAmount)/(10**18);
        return ethInUSD;
    }
}