// SPDX-License-Identifier: MIT

/*
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract TimestampOracle is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    uint256 public latestTimestamp;

    event TimestampUpdated(uint256 timestamp);

    constructor() {
        setPublicChainlinkToken();
        oracle = 0x7FfC57839B00206D1ad20c69A1981b489f772031; // Chainlink Oracle 地址
        jobId = "b6602d14e4734c49a5e1ce19d45a4632"; // Chainlink Job ID
        fee = 0.1 * 10 ** 18; // 0.1 LINK
    }

    function requestTimestamp(string memory _url, string memory _path) public {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req.add("get", _url);
        req.add("path", _path);
    }

    function fulfill(bytes32 _requestId, uint256 _timestamp) public recordChainlinkFulfillment(_requestId) {
        latestTimestamp = _timestamp;
        emit TimestampUpdated(_timestamp);
    }
}
*/