// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

interface IDino {
    function offeringPercentage() external view returns (uint);
    function ownPercentage() external view returns (uint);
    function exitPercentage() external view returns (uint);
    function feePercentage() external view returns (uint);
    function auctionFeePercentage() external view returns (uint);
    function newNFTFee() external view returns (uint);
    function admin() external view returns (address);
    function receiver() external view returns (address);
    function controller() external view returns (address);
    function staker() external view returns (address);
    function offer() external view returns (address);
    function distributor() external view returns (address);
    function mapper() external view returns (address);
    function dino721() external view returns (address);
    function auction() external view returns (address);
    function mint(address,uint) external;
}