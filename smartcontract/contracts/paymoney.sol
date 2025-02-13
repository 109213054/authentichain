// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentReceiver {
    address public owner;
    uint256 public constant fee = 0.001 ether; // 🟢 手續費設定為 0.001 MATIC

    event PaymentReceived(address indexed sender, uint256 amount);
    event Withdraw(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 🟢 接收付款的函數
    function pay() external payable {
        require(msg.value >= fee, "Insufficient MATIC sent");

        emit PaymentReceived(msg.sender, msg.value);
    }

    // 🟢 提領合約內的 MATIC
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No MATIC available for withdrawal");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdraw(owner, balance);
    }

    // 🟢 允許合約接收 MATIC
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
