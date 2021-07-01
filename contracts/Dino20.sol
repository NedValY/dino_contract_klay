// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./interfaces/IDino.sol";
import "./interfaces/IController.sol";
import "./library/KIP7.sol";
import "./library/KIP7Metadata.sol";

contract Dino20 is KIP7, KIP7Metadata {
    IDino public dino;

    constructor(
        string memory name_,
        string memory symbol_,
        address _dino,
        uint _initialSupply
    ) public KIP7Metadata(name_, symbol_, 18) {
        dino = IDino(_dino);
        _mint(msg.sender, _initialSupply);
    }

    function setDino(address _dino) public {
        require(msg.sender == dino.admin(), "Dino: admin");
        dino = IDino(_dino);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        if(from != address(0)) {
            IController(dino.controller()).refreshOwner(from, to, amount);
        }
    }
}