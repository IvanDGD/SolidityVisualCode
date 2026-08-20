// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Forum {

    event PostCreated(uint indexed id, address indexed author, uint timestamp);
    event PostDeleted(uint indexed id, address indexed author);
    event PostLiked(uint indexed id, address indexed liker, bool isLiked);

    struct Post {
        uint id;
        string content;
        address author;
        uint timestamp;
        uint likes;
        bool isDeleted;
    }

    Post[] public posts;
    mapping(uint => mapping(address => bool)) public hasLiked;

    function create_post(string memory content) external {
        uint postId = posts.length;
        posts.push(
            Post(postId, content, msg.sender, block.timestamp, 0, false)
        );
        emit PostCreated(postId, msg.sender, block.timestamp);
    }

    function get_posts() external view returns (Post[] memory) {
        return posts;
    }

    function get_postByAuthor(address author) external view returns (Post[] memory) {
        require(author != address(0), "Invalid author address");
        
        uint count = 0;
        for (uint i = 0; i < posts.length; i++) {
            if (posts[i].author == author && !posts[i].isDeleted) {
                count++;
            }
        }

        Post[] memory authorPosts = new Post[](count);
        uint index = 0;
        for (uint i = 0; i < posts.length; i++) {
            if (posts[i].author == author && !posts[i].isDeleted) {
                authorPosts[index] = posts[i];
                index++;
            }
        }
        return authorPosts;
    }

    function delete_post(uint id) external {
        require(id < posts.length, "Post does not exist");
        require(posts[id].author == msg.sender, "Only author can delete");
        require(!posts[id].isDeleted, "Post already deleted");

        posts[id].isDeleted = true;
        emit PostDeleted(id, msg.sender);
    }

    function toggle_like(uint id) external {
        require(id < posts.length, "Post does not exist");
        require(!posts[id].isDeleted, "Post is deleted");

        if (hasLiked[id][msg.sender]) {
            hasLiked[id][msg.sender] = false;
            posts[id].likes--;
            emit PostLiked(id, msg.sender, false);
        } else {
            hasLiked[id][msg.sender] = true;
            posts[id].likes++;
            emit PostLiked(id, msg.sender, true);
        }
    }
}