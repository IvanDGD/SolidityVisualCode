// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract MediaStore {
    struct Media {
        address creator;
        string cid;
        string name;
        uint timestamp;
        bool isDeleted;
    }

    Media[] pics;

    function new_pic(string memory cid, string memory name) external {
        pics.push(
            Media(msg.sender, cid, name, block.timestamp, false)
        );
    }

    function delete_pic(uint idx) external {
        require(idx < pics.length, "Not found");
        require(pics[idx].creator == msg.sender, "Not authorized");
        pics[idx].isDeleted = true;
    }

    function get_pics() external view returns(Media[] memory){
        return pics;
    }

    function get_pic(uint idx) external view returns(Media memory){
        require(idx < pics.length, "Not found");
        return pics[idx];
    }
}