// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

interface IMapper {
    function tokenInfos(address,uint) external view returns (address, address);
    function dino20ToNFTInfo(address) external view returns (address, uint);
    function newNFT(address, uint, address, address) external;
    function refreshOwner(address, address) external;
    function exit(address,address) external;
}