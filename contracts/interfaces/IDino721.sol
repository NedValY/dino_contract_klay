// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

interface IDino721 {
    function mint(address,uint) external;
    function totalSupply() external view returns (uint);
}