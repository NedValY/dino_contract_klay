// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IKIP7.sol";
import "./library/SafeMath.sol";
import "./interfaces/IDino.sol";
import "./interfaces/IMapper.sol";

contract Offer {
    using SafeMath for uint;

    IDino public dino;

    bytes4 private constant _KIP7_RECEIVED = 0x9d188c22;

    struct PoolInfo {
        address owner;
        uint112 offeringAmount;
        uint112 totalAmount;
        uint32 endBlock;
    }

    mapping(address => PoolInfo) public poolInfos;
    mapping(address => mapping(address => uint)) public userAmounts;

    event Deposited(
        address indexed dino20,
        address indexed account,
        uint balance,
        uint totalBalance);

    event Withdrawal(
        address indexed dino20,
        address indexed account,
        uint balance,
        uint totalBalance);

    event Claim(
        address indexed dino20,
        address indexed account,
        uint offeringAmount,
        uint feeAmount,
        uint totalBalance,
        uint leftOfferingAmount);

    event ClaimOwner(
        address indexed dino20,
        address indexed account,
        uint amount);

    constructor (address _dino) public {
        dino = IDino(_dino);
    }

    function setDino(address _dino) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        dino = IDino(_dino);
    }

    function newOffering(
        address dino20,
        address owner,
        uint endBlock,
        uint initialSupply,
        uint offeringAmount
    ) public {
        require(msg.sender == dino.controller(), "Dino: controller");

        poolInfos[dino20] = PoolInfo(
            owner,
            safe112(offeringAmount),
            0,
            safe32(endBlock));

        IKIP7(dino20).transferFrom(msg.sender, address(this), initialSupply);
    }

    function deposit(address dino20, uint amount) public {
        PoolInfo storage pool = poolInfos[dino20];
        require(block.number < pool.endBlock, "Dino: over");

        IKIP7(address(dino)).transferFrom(msg.sender, address(this), amount);
        userAmounts[dino20][msg.sender] = userAmounts[dino20][msg.sender].add(amount);
        pool.totalAmount = safe112(uint(pool.totalAmount).add(amount));

        emit Deposited(
            dino20,
            msg.sender,
            userAmounts[dino20][msg.sender],
            pool.totalAmount);
    }

    function withdraw(address dino20, uint amount) public {
        PoolInfo storage pool = poolInfos[dino20];
        require(block.number < pool.endBlock, "Dino: over");

        IKIP7(address(dino)).transfer(msg.sender, amount);
        userAmounts[dino20][msg.sender] = userAmounts[dino20][msg.sender].sub(amount);
        pool.totalAmount = safe112(uint(pool.totalAmount).sub(amount));

        emit Withdrawal(
            dino20,
            msg.sender,
            userAmounts[dino20][msg.sender],
            pool.totalAmount);
    }

    function claim(address dino20) public {
        PoolInfo storage pool = poolInfos[dino20];
        require(block.number >= pool.endBlock, "Dino: not over");

        uint userAmount = userAmounts[dino20][msg.sender];
        delete userAmounts[dino20][msg.sender];

        uint userOfferingAmount = userAmount
            .mul(uint(pool.offeringAmount))
            .div(uint(pool.totalAmount));

        pool.offeringAmount = safe112(uint(pool.offeringAmount).sub(userOfferingAmount));
        pool.totalAmount = safe112(uint(pool.totalAmount).sub(userAmount));

        uint feeAmount = userAmount
            .mul(dino.feePercentage())
            .div(1e18);

        IKIP7(dino20).transfer(msg.sender, userOfferingAmount);
        IKIP7(address(dino)).transfer(dino.staker(), feeAmount);
        IKIP7(address(dino)).transfer(msg.sender, userAmount.sub(feeAmount));

        emit Claim(
            dino20,
            msg.sender,
            userOfferingAmount,
            feeAmount,
            pool.totalAmount,
            pool.offeringAmount);
    }

    function claimOwner(address dino20) public {
        PoolInfo memory pool = poolInfos[dino20];
        require(block.number >= pool.endBlock, "Dino: not over");
        uint currentBalance = IKIP7(dino20).balanceOf(address(this));

        if(currentBalance > pool.offeringAmount) {
            uint ownerBalance = currentBalance.sub(uint(pool.offeringAmount));

            IKIP7(dino20).transfer(pool.owner, ownerBalance);

            emit ClaimOwner(
                dino20,
                pool.owner,
                ownerBalance);
        }
    }

    function getClaimAmount(address dino20, address account) public view returns (uint, uint) {
        PoolInfo memory pool = poolInfos[dino20];

        if(pool.totalAmount == 0) {
            return (0, 0);
        }

        uint userAmount = userAmounts[dino20][account];

        uint userOfferingAmount = userAmount
            .mul(uint(pool.offeringAmount))
            .div(uint(pool.totalAmount));

        uint feeAmount = userAmount
            .mul(dino.feePercentage())
            .div(1e18);

        return (userOfferingAmount, userAmount.sub(feeAmount));
    }

    function safe112(uint amount) internal pure returns (uint112) {
        require(amount < 2**112, "Dino: 112");
        return uint112(amount);
    }

    function safe32(uint amount) internal pure returns (uint32) {
        require(amount < 2**32, "Dino: 32");
        return uint32(amount);
    }

    function onKIP7Received(address _operator, address _from, uint256 _amount, bytes calldata _data) external returns (bytes4) {
        return _KIP7_RECEIVED;
    }
}