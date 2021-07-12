// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IDino.sol";
import "./interfaces/IOffer.sol";
import "./interfaces/IDino721.sol";
import "./interfaces/IKIP7.sol";
import "./interfaces/IKIP17.sol";
import "./interfaces/IMapper.sol";

import "./Dino20.sol";

import "./library/SafeMath.sol";

contract Controller {
    using SafeMath for uint;

    IDino public dino;
    bytes4 internal constant ON_ERC721_RECEIVED = 0x150b7a02;
    bytes4 private constant _KIP7_RECEIVED = 0x9d188c22;

    event NewDino721(
        address indexed nft,
        uint indexed tokenId,
        address indexed dino20,
        address owner,
        uint endBlock,
        uint initialSupply,
        uint offeringAmount,
        address[4] holders,
        uint[4] holderPercentages);

    event OwnerRefreshed(
        address indexed nft,
        uint indexed tokenId,
        address indexed dino20,
        address newOwner);

    event Exited(
        address indexed nft,
        uint indexed tokenId,
        address indexed dino20,
        address account);

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
        string memory name_,
        string memory symbol_,
        uint initialSupply,
        uint endBlock,
        address[4] memory holders,
        uint[4] memory holderPercentages
    ) public payable {
        require(endBlock > block.number, "Dino: offering block");
        require(msg.value == dino.newNFTFee(), "Dino: nft fee");
        require(initialSupply < 2**112, "Dino: 112");

        uint totalHolderPercentage;
        for(uint i = 0; i<4; i++) {
            totalHolderPercentage = totalHolderPercentage.add(holderPercentages[i]);
        }
        require(totalHolderPercentage <= 1e18, "Dino: holders");

        address newNFTAddress = nft;
        uint newTokenId = tokenId;
        if(nft == address(0)) {
            newNFTAddress = dino.dino721();
            newTokenId = getDino721NextTokenId();
            IDino721(dino.dino721()).mint(address(this), newTokenId);
        } else {
            IKIP17(newNFTAddress).safeTransferFrom(msg.sender, address(this), newTokenId);
        }

        IKIP7 newDino20 = IKIP7(
            new Dino20(
                name_,
                symbol_,
                address(dino),
                initialSupply));

        IKIP17(newNFTAddress).approve(dino.mapper(), newTokenId);
        IMapper(dino.mapper()).newNFT(
            newNFTAddress,
            newTokenId,
            address(newDino20),
            address(this));

        uint offeringAmount = initialSupply
            .mul(dino.offeringPercentage())
            .div(1e18);

        newDino20.approve(dino.offer(), initialSupply);
        IOffer(dino.offer()).newOffering(
            address(newDino20),
            msg.sender,
            endBlock,
            initialSupply,
            offeringAmount,
            holders,
            holderPercentages);

        emit NewDino721(
            newNFTAddress,
            newTokenId,
            address(newDino20),
            msg.sender,
            endBlock,
            initialSupply,
            offeringAmount,
            holders,
            holderPercentages);
    }

    function refreshOwner(
        address _from,
        address _to,
        uint amount
    ) public {
        IMapper mapper = IMapper(dino.mapper());
        (address nft, uint tokenId) = mapper.dino20ToNFTInfo(msg.sender);
        (address dino20, address owner) = mapper.tokenInfos(nft, tokenId);
        require(msg.sender == dino20, "Dino: dino20");

        IKIP7 idino20 = IKIP7(dino20);

        uint ownerMinimumAmount = idino20.totalSupply()
            .mul(dino.ownPercentage())
            .div(1e18);

        address newOwner = owner;

        if(_from == owner && ownerMinimumAmount > idino20.balanceOf(_from).sub(amount)) {
            newOwner = address(0);
        }
        if(ownerMinimumAmount <= idino20.balanceOf(_to).add(amount)) {
            newOwner = _to;
        }

        if(newOwner != owner) {
            mapper.refreshOwner(dino20, newOwner);
            emit OwnerRefreshed(
                nft,
                tokenId,
                dino20,
                newOwner);
        }
    }

    function exit(address dino20) public {
        IMapper mapper = IMapper(dino.mapper());
        (address nft, uint tokenId) = mapper.dino20ToNFTInfo(dino20);
        (, address owner) = mapper.tokenInfos(nft, tokenId);
        require(msg.sender == owner, "Dino: nft owner");

        IKIP7 _dino20 = IKIP7(dino20);

        require(_dino20.balanceOf(msg.sender)
            >= _dino20.totalSupply()
                .mul(dino.exitPercentage())
                .div(1e18), "Dino: exit");

        mapper.exit(dino20, owner);

        emit Exited(
            nft,
            tokenId,
            dino20,
            msg.sender);
    }

    function getDino721NextTokenId() public view returns (uint) {
        return IDino721(dino.dino721()).totalSupply() + 1;
    }

    function receiveNFTFee() public {
        address(uint160(dino.receiver())).transfer(address(this).balance);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        return ON_ERC721_RECEIVED;
    }

    function onKIP7Received(address _operator, address _from, uint256 _amount, bytes calldata _data) external returns (bytes4) {
        return _KIP7_RECEIVED;
    }
}