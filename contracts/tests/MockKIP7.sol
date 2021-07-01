// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "../library/KIP7.sol";
import "../library/KIP7Metadata.sol";

contract MockKIP7 is KIP7, KIP7Metadata {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    ) public KIP7Metadata(name, symbol, 18) {
        _mint(msg.sender, supply);
    }

    function mint(address account) public {
        _mint(account, 1000);
    }

    function mint(address account, uint amount) public {
        _mint(account, amount);
    }
}