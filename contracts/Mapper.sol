// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IDino.sol";
import "./interfaces/IKIP7.sol";
import "./interfaces/IKIP17.sol";
import "./library/SafeMath.sol";

contract Mapper {
    using SafeMath for uint;

    IDino public dino;

    bytes4 internal constant ON_ERC721_RECEIVED = 0x150b7a02;

    struct TokenInfo {
        IKIP7 dino20;
        address owner;
    }

    struct NFTInfo {
        address token;
        uint tokenId;
    }

    mapping(address => mapping(uint => TokenInfo)) public tokenInfos;
    mapping(address => NFTInfo) public dino20ToNFTInfo;

    constructor(address _dino) public {
        dino = IDino(_dino);
    }

    function setDino(address _dino) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        dino = IDino(_dino);
    }

    function newNFT(
        address nft,
        uint tokenId,
        address dino20,
        address owner
    ) public {
        require(msg.sender == dino.controller(), "Dino: controller");

        tokenInfos[nft][tokenId] = TokenInfo(IKIP7(dino20), owner);
        dino20ToNFTInfo[dino20] = NFTInfo(nft, tokenId);

        IKIP17(nft).safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function refreshOwner(
        address dino20,
        address newOwner
    ) public {
        require(msg.sender == dino.controller(), "Dino: controller");
        NFTInfo memory nft = dino20ToNFTInfo[dino20];
        tokenInfos[nft.token][nft.tokenId].owner = newOwner;
    }

    function exit(address dino20, address owner) public {
        require(msg.sender == dino.controller(), "Dino: controller");
        NFTInfo memory nft = dino20ToNFTInfo[dino20];

        delete tokenInfos[nft.token][nft.tokenId];
        delete dino20ToNFTInfo[dino20];

        IKIP17(nft.token).safeTransferFrom(address(this), owner, nft.tokenId);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        return ON_ERC721_RECEIVED;
    }
}