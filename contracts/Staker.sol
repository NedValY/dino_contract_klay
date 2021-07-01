// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./library/KIP7.sol";
import "./library/KIP7Metadata.sol";
import "./library/SafeMath.sol";
import "./interfaces/IDino.sol";

contract Staker is KIP7, KIP7Metadata {
    using SafeMath for uint;

    bytes4 private constant _KIP7_RECEIVED = 0x9d188c22;

    IKIP7 public dino;

    event Staked(
        address indexed account,
        uint amount,
        uint shares);

    event Unstaked(
        address indexed account,
        uint amount,
        uint shares);

    constructor (address _dino) public KIP7Metadata("SDino", "SDino", 18) {
        dino = IKIP7(_dino);
    }

    function setDino(address _dino) public {
        require(msg.sender == IDino(address(dino)).admin(), "Dino: admin");
        dino = IKIP7(_dino);
    }

    function stake(uint amount) public {
        uint totalBalance = dino.balanceOf(address(this));
        uint mintShares = totalBalance == 0
            ? amount
            : amount
                .mul(totalSupply())
                .div(totalBalance);

        _mint(msg.sender, mintShares);
        dino.transferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, mintShares);
    }

    function unstake(uint shares) public {
        uint unstakeAmount = shares
            .mul(dino.balanceOf(address(this)))
            .div(totalSupply());

        _burn(msg.sender, shares);
        dino.transfer(msg.sender, unstakeAmount);

        emit Unstaked(msg.sender, unstakeAmount, shares);
    }

    function onKIP7Received(address _operator, address _from, uint256 _amount, bytes calldata _data) external returns (bytes4) {
        return _KIP7_RECEIVED;
    }
}