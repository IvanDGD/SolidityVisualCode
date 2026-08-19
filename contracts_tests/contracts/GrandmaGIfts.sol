// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract GrandmotherGifts {
    address public grandma;
    uint256 public giftAmount;

    mapping(address => uint256) public birthdays;
    mapping(address => bool) public hasClaimed;

    constructor() {
        grandma = msg.sender;
    }

    function addGrandchild(address _grandchild, uint256 _birthday) public {
        require(msg.sender == grandma, "Only grandma");
        birthdays[_grandchild] = _birthday;
    }

    function deposit(uint256 _giftAmountPerChild) public payable {
        require(msg.sender == grandma, "Only grandma");
        giftAmount = _giftAmountPerChild;
    }

    function claimGift() public {
        require(birthdays[msg.sender] > 0, "Not a grandchild");
        require(block.timestamp >= birthdays[msg.sender], "Birthday has not come yet");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(address(this).balance >= giftAmount, "Not enough ETH in contract");

        hasClaimed[msg.sender] = true;
        payable(msg.sender).transfer(giftAmount);
    }
}