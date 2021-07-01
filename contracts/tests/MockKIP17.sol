// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "../library/KIP17Enumerable.sol";
import "../library/KIP17Metadata.sol";
import "../library/Strings.sol";

contract MockKIP17 is KIP17Enumerable, KIP17Metadata {
    using Strings for uint256;

    constructor() KIP17Metadata("test721", "test721") public {

    }

    function mint(address account, uint tokenId) public {
        _mint(account, tokenId);
    }

    function _baseURI() internal view returns (string memory) {
        return "https://nft.dinoart.io/api/v0/nft/token/2/";
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "KIP17Metadata: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
        ? string(abi.encodePacked(baseURI, tokenId.toString()))
        : '';
    }
}