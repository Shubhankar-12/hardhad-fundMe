// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PriceConverter.sol";
error FundMe__NotOwner();

/**@title A contract for crowd funding
 * @author Shubh Shubhankar
 * @notice This contract is to demo crowd funding
 * @dev This implements the price feeds as a library
 */
contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MIN_USD = 50 * 10**18;

    mapping(address => uint256) public s_addressToamountFunded;
    AggregatorV3Interface public s_priceFeed;
    address[] public s_funders;
    address public immutable i_owner;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner,"Sender isn't the Owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
            "You need to spend more ETH!"
        );
        s_funders.push(msg.sender);
        s_addressToamountFunded[msg.sender] += msg.value;
    }

    function getAddressToAmountFunded(address fundingAddress) public view returns (uint256)
    {
        return s_addressToamountFunded[fundingAddress];
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToamountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        // bool sendSuccess=payable(msg.sender).send(address(this).balance);
        // require(sendSuccess,"Send failed!");
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
    }
    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
    function cheaperWithdraw() public payable onlyOwner{
        address[] memory funders=s_funders;
        for (uint i = 0; i < funders.length; i++) {
            address funder=funders[i];
            s_addressToamountFunded[funder]=0;
        }
        s_funders=new address[](0);
        (bool success,)=i_owner.call{value:address(this).balance}("");
        require(success);
    }
}
