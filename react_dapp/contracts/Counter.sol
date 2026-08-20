// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Counter {
    uint public count;

    struct User{
        string name;
        uint age;
    }

    function get_user() external pure returns(User memory) {
        return User("Tom", 24);
    }

    function set_value(uint _count) external {
        count = _count;
    }
    function get_value() external view returns(uint) {
        return count;
    }
}