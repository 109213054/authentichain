// SPDX-License-Identifier: MIT
/*
pragma solidity ^0.8.0;

contract CertificateStorage {
    // **儲存 productSerial → (ipfsCID, timestamp)**
    struct Certificate {
        string ipfsCID;
        uint256 timestamp;
    }

    mapping(string => Certificate) private certificates;
    string[] public serials; // 存放所有的產品序號

    // 管理員地址
    address public admin;

    // 事件
    event CertificateAdded(string productSerial, string ipfsCID, uint256 timestamp);

    // 管理員限制
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // **合約構造函數**
    constructor() {
        admin = msg.sender;
    }

    // 📌 **新增證書**
    function addCertificate(
        string memory _productSerial,
        string memory _ipfsCID,
        uint256 _timestamp
    ) public {
        require(bytes(_productSerial).length > 0, "Product serial cannot be empty");
        require(certificates[_productSerial].timestamp == 0, "Product serial already exists");

        certificates[_productSerial] = Certificate({
            ipfsCID: _ipfsCID,
            timestamp: _timestamp
        });

        serials.push(_productSerial);

        emit CertificateAdded(_productSerial, _ipfsCID, _timestamp);
    }

    // 📌 **查詢證書**
    function getCertificate(string memory _productSerial) public view returns (string memory, uint256) {
        require(certificates[_productSerial].timestamp != 0, "Certificate does not exist");
        return (certificates[_productSerial].ipfsCID, certificates[_productSerial].timestamp);
    }
}
*/