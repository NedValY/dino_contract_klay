// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./library/KIP7.sol";
import "./library/KIP7Metadata.sol";
import "./library/SafeMath.sol";

contract Dino is KIP7, KIP7Metadata {
    using SafeMath for uint;

    address public admin;
    address public receiver;
    address public controller;
    address public mapper;
    address public staker;
    address public offer;
    address public distributor;
    address public dino721;
    address public auction;

    uint public offeringPercentage;
    uint public feePercentage;
    uint public newNFTFee;
    uint public ownPercentage;
    uint public exitPercentage;
    uint public auctionFeePercentage;

    mapping(address => bool) public minters;

    event NewAdmin(address indexed newAdmin);
    event NewReceiver(address indexed newReceiver);
    event NewController(address indexed newController);
    event NewMapper(address indexed newMapper);
    event NewStaker(address indexed newStaker);
    event NewOffer(address indexed newOffer);
    event NewDistributor(address indexed newDistributor);
    event NewDino721(address indexed newDino721);
    event NewMinter(address indexed newMinter);
    event NewAuction(address indexed newAuction);

    event NewOfferingPercentage(uint newOfferingPercentage);
    event NewFeePercentage(uint newFeePercentage);
    event NewNFTFee(uint newNFTFee);
    event NewOwnPercentage(uint newOwnPercentage);
    event NewExitPercentage(uint newExitPercentage);
    event NewAuctionFeePercentage(uint newAuctionFeePercentage);

    constructor(address _admin, address _receiver) KIP7Metadata("Dino", "Dino", 18) public {
        admin = _admin;
        receiver = _receiver;

        offeringPercentage = 0.1e18;
        ownPercentage = 0.51e18;
        exitPercentage = 0.95e18;
        feePercentage = 0.001e18;
        auctionFeePercentage = 0.001e18;
        newNFTFee = 0.1e18;
    }

    function setOfferingPercentage(uint _offeringPercentage) public {
        require(msg.sender == admin, "Dino: admin");
        require(uint(1e18).sub(ownPercentage) >= _offeringPercentage, "Dino: offering percentage");

        offeringPercentage = _offeringPercentage;

        emit NewOfferingPercentage(offeringPercentage);
    }

    function setOwnPercentage(uint _ownPercentage) public {
        require(msg.sender == admin, "Dino: admin");
        require(uint(1e18).sub(offeringPercentage) >= _ownPercentage
            && _ownPercentage > 0.5e18
            && _ownPercentage < exitPercentage, "Dino: own percentage");

        ownPercentage = _ownPercentage;

        emit NewOwnPercentage(ownPercentage);
    }

    function setFeePercentage(uint _feePercentage) public {
        require(msg.sender == admin, "Dino: admin");

        feePercentage = _feePercentage;

        emit NewFeePercentage(feePercentage);
    }

    function setAuctionFeePercentage(uint _auctionFeePercentage) public {
        require(msg.sender == admin, "Dino: admin");

        auctionFeePercentage = _auctionFeePercentage;

        emit NewAuctionFeePercentage(auctionFeePercentage);
    }

    function setNewNFTFee(uint _newNFTFee) public {
        require(msg.sender == admin, "Dino: admin");

        newNFTFee = _newNFTFee;

        emit NewNFTFee(newNFTFee);
    }

    function setMinter(address _minter) public {
        require(msg.sender == admin, "Dino: admin");

        minters[_minter] = true;

        emit NewMinter(_minter);
    }

    function setExitPercentage(uint _exitPercentage) public {
        require(msg.sender == admin, "Dino: admin");
        require(_exitPercentage > ownPercentage, "Dino: exit percentage");

        exitPercentage = _exitPercentage;

        emit NewExitPercentage(exitPercentage);
    }

    function setAdmin(address _admin) public {
        require(msg.sender == admin, "Dino: admin");
        admin = _admin;

        emit NewAdmin(admin);
    }

    function setReceiver(address _receiver) public {
        require(msg.sender == admin, "Dino: admin");
        receiver = _receiver;

        emit NewReceiver(receiver);
    }

    function setController(address _controller) public {
        require(msg.sender == admin, "Dino: admin");
        controller = _controller;

        emit NewController(controller);
    }

    function setMapper(address _mapper) public {
        require(msg.sender == admin, "Dino: admin");
        mapper = _mapper;

        emit NewMapper(mapper);
    }

    function setStaker(address _staker) public {
        require(msg.sender == admin, "Dino: admin");
        staker = _staker;

        emit NewStaker(staker);
    }

    function setOffer(address _offer) public {
        require(msg.sender == admin, "Dino: admin");
        offer = _offer;

        emit NewOffer(offer);
    }

    function setDistributor(address _distributor) public {
        require(msg.sender == admin, "Dino: admin");
        distributor = _distributor;
        minters[distributor] = true;

        emit NewDistributor(distributor);
        emit NewMinter(distributor);
    }

    function setDino721(address _dino721) public {
        require(msg.sender == admin, "Dino: admin");
        dino721 = _dino721;

        emit NewDino721(dino721);
    }

    function setAuction(address _auction) public {
        require(msg.sender == admin, "Dino: admin");
        auction = _auction;

        emit NewAuction(auction);
    }

    function mint(address _to, uint amount) public {
        require(minters[msg.sender], "Dino: minter");
        _mint(_to, amount);
    }
}