// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IKIP7.sol";
import "./interfaces/IKIP17.sol";
import "./library/SafeMath.sol";
import "./interfaces/IDino.sol";
import "./interfaces/IMapper.sol";

contract Auction {
    using SafeMath for uint;

    bytes4 internal constant ON_ERC721_RECEIVED = 0x150b7a02;
    bytes4 private constant _KIP7_RECEIVED = 0x9d188c22;

    struct AuctionInfo {
        IKIP7 bidToken;
        IKIP17 bidNft;
        address beneficiary;
        address currentBidAddress;
        uint bidTokenId;
        uint32 endBlock;
        uint112 currentBidAmount;
        bool isDino;
    }

    IDino public dino;
    mapping(address => bool) public canBeBidToken;
    mapping(address => mapping(uint => uint)) public bidAmounts;
    AuctionInfo[] public auctionInfos;

    event NewAuction(
        uint indexed auctionId,
        address indexed bidTokenAddress,
        address indexed bidNftAddress,
        address beneficiary,
        uint bidTokenId,
        uint endBlock,
        uint minimumBidAmount,
        bool isDino);

    event Bid(
        uint indexed auctionId,
        address indexed account,
        uint amount);

    event Claim(
        uint indexed auctionId,
        address indexed account);

    event NewBidToken(address newBidToken);

    constructor (address _dino) public {
        dino = IDino(_dino);
        canBeBidToken[_dino] = true;

        auctionInfos.push(AuctionInfo(
            IKIP7(address(0)),
            IKIP17(address(0)),
            address(0),
            address(0),
            0,
            0,
            0,
            false));
    }

    function setDino(address _dino) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        dino = IDino(_dino);
    }

    function addBidToken(address newBidToken) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        canBeBidToken[newBidToken] = true;

        emit NewBidToken(newBidToken);
    }

    function createAuction(
        address bidTokenAddress,
        address bidNftAddress,
        address beneficiary,
        uint bidTokenId,
        uint endBlock,
        uint minimumBidAmount
    ) public {

        IMapper mapper = IMapper(dino.mapper());
        (address nft, ) = mapper.dino20ToNFTInfo(bidTokenAddress);

        require(canBeBidToken[bidTokenAddress] || nft != address(0), "Dino: bid token"); //dino bid or dino20 bid

        (address dino20, ) = mapper.tokenInfos(bidNftAddress, bidTokenId);

        IKIP17 bidNft = IKIP17(bidNftAddress);
        if(dino20 == address(0)) { //not dino20, external
            bidNft.safeTransferFrom(msg.sender, address(this), bidTokenId);
        } else { //dino20 (no nft transfer)
            IKIP7 idino20 = IKIP7(dino20);
            uint ownerMinimumAmount = idino20.totalSupply()
                .mul(dino.ownPercentage())
                .div(1e18);
            idino20.transferFrom(msg.sender, address(this), ownerMinimumAmount);
        }

        auctionInfos.push(AuctionInfo(
            IKIP7(bidTokenAddress),
            bidNft,
            beneficiary,
            address(0),
            bidTokenId,
            safe32(endBlock),
            safe112(minimumBidAmount),
            dino20 != address(0)));

        bidAmounts[beneficiary][auctionInfos.length - 1] = 1; //check beneficiary claim

        emit NewAuction(
            auctionInfos.length - 1,
            bidTokenAddress,
            bidNftAddress,
            beneficiary,
            bidTokenId,
            endBlock,
            minimumBidAmount,
            dino20 != address(0));

    }

    function bid(
        uint auctionId,
        uint bidAmount
    ) public {
        AuctionInfo storage auctionInfo = auctionInfos[auctionId];
        require(msg.sender != auctionInfo.beneficiary, "Dino: beneficiary"); //beneficiary cannot bid
        require(block.number < auctionInfo.endBlock, "Dino: over");
        require(auctionInfo.currentBidAmount < bidAmount, "Dino: bid amount");

        auctionInfo.bidToken.transferFrom(
            msg.sender,
            address(this),
            bidAmount.sub(bidAmounts[msg.sender][auctionId]));

        bidAmounts[msg.sender][auctionId] = bidAmount;

        auctionInfo.currentBidAmount = safe112(bidAmount);
        auctionInfo.currentBidAddress = msg.sender;

        emit Bid(
            auctionId,
            msg.sender,
            bidAmount);
    }

    function claim(
        uint auctionId
    ) public {
        AuctionInfo storage auctionInfo = auctionInfos[auctionId];
        require(bidAmounts[msg.sender][auctionId] > 0, "Dino: only once"); //once check

        emit Claim(
            auctionId,
            msg.sender);

        if(msg.sender != auctionInfo.currentBidAddress && msg.sender != auctionInfo.beneficiary) { //refund
            auctionInfo.bidToken.transfer(msg.sender, bidAmounts[msg.sender][auctionId]);
            delete bidAmounts[msg.sender][auctionId];
            return;
        }

        require(block.number >= auctionInfo.endBlock, "Dino: not over"); //claim period check
        delete bidAmounts[msg.sender][auctionId];

        if(msg.sender == auctionInfo.beneficiary && auctionInfo.currentBidAddress != address(0)) { //someone bid
            uint feeAmount = uint(auctionInfo.currentBidAmount)
                .mul(dino.auctionFeePercentage())
                .div(1e18); //fee
            auctionInfo.bidToken.transfer(dino.receiver(), feeAmount);
            auctionInfo.bidToken.transfer(msg.sender, uint(auctionInfo.currentBidAmount).sub(feeAmount));
            return;
        }

        if(auctionInfo.isDino) { //claim or refund if no one bids
            IMapper mapper = IMapper(dino.mapper());
            (address dino20, ) = mapper.tokenInfos(address(auctionInfo.bidNft), auctionInfo.bidTokenId);

            IKIP7 idino20 = IKIP7(dino20);
            uint ownerMinimumAmount = idino20.totalSupply()
                .mul(dino.ownPercentage())
                .div(1e18);
            idino20.transfer(msg.sender, ownerMinimumAmount);
        } else {
            auctionInfo.bidNft.safeTransferFrom(address(this), msg.sender, auctionInfo.bidTokenId);
        }
    }

    function safe112(uint amount) internal pure returns (uint112) {
        require(amount < 2**112, "Dino: 112");
        return uint112(amount);
    }

    function safe32(uint amount) internal pure returns (uint32) {
        require(amount < 2**32, "Dino: 32");
        return uint32(amount);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        return ON_ERC721_RECEIVED;
    }

    function onKIP7Received(address _operator, address _from, uint256 _amount, bytes calldata _data) external returns (bytes4) {
        return _KIP7_RECEIVED;
    }
}