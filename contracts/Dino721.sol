// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IDino.sol";
import "./library/KIP17Enumerable.sol";
import "./library/KIP17Metadata.sol";
import "./library/Strings.sol";

contract Dino721 is KIP17Enumerable, KIP17Metadata {
    using Strings for uint256;

    IDino public dino;

    constructor(address _dino) KIP17Metadata("Dino721", "Dino721") public {
        dino = IDino(_dino);
    }

    function setDino(address _dino) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        dino = IDino(_dino);
    }

    function mint(address account, uint tokenId) public {
        require(msg.sender == dino.controller(), "Dino: controller");
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