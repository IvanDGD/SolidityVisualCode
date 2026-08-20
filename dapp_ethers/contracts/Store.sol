// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Store {

    struct Product{
        string name;
        string desc;
        uint price;
        address seller;
        uint timestamp;
        string imgURL;
    }

    Product[] products;

    function add_product(string memory name, string memory desc, uint price, string memory imgURL) external {
        products.push(
            Product(name, desc, price, msg.sender, block.timestamp, imgURL)
        );
    }
    
    function get_products() external view returns(Product[] memory) {
        return products;
    }
}