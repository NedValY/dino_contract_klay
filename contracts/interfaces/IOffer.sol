// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

interface IOffer {
    function poolInfos(address) external view returns (address, uint112, uint112, uint32);
    function userAmounts(address, address) external view returns (uint);
    function newOffering(address, address, uint, uint, uint, address[4] calldata, uint[4] calldata) external;
    function deposit(address, address, uint) external;
    function withdraw(address, address, uint) external;
    function claim(address) external;
}