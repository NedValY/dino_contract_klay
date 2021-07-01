// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

interface IController {
    function refreshOwner(address,address,uint) external;
}