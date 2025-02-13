// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract CertificateStorage {
    // 定義證書的結構
    struct Certificate {
        string storeName; // 店家名稱
        string productName; // 產品名稱
        string productDescription; // 產品描述
        string productSerial; // 唯一產品序號
        string ipfsCID; // 證書圖片的 IPFS CID
        string status; // 證書狀態 (success, pending, revoked)
        uint256 productionDate; // 生產日期 (timestamp)
        address storeAddress; // 店家的區塊鏈地址
    }

    // 管理員地址
    address public admin;

    // 事件，用於記錄新增的證書
    event CertificateAdded(
        string productSerial,
        string ipfsCID,
        uint256 timestamp,
        address indexed storeAddress
    );

    event CertificateStatusUpdated(
        string productSerial,
        string newStatus,
        uint256 timestamp
    );

    // 儲存所有的證書，通過產品序號查詢
    mapping(string => Certificate) private certificates;
    string[] public serials; // 保存所有的產品序號

    // 管理員限制
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // 店家限制
    modifier onlyStoreOwner(string memory _productSerial) {
        require(
            certificates[_productSerial].storeAddress == msg.sender,
            "Only the store owner can perform this action"
        );
        _;
    }

    // 合約構造函數
    constructor() {
        admin = msg.sender;
    }


    // 新增證書資料
    function addCertificate(
        string memory _storeName,
        string memory _productName,
        string memory _productDescription,
        string memory _productSerial,
        string memory _ipfsCID,
        uint256 _productionDate,
        string memory _status
    ) public {
        require(bytes(_productSerial).length > 0, "Product serial cannot be empty");
        require(certificates[_productSerial].productionDate == 0, "Product serial already exists");

        certificates[_productSerial] = Certificate({
            storeName: _storeName,
            productName: _productName,
            productDescription: _productDescription,
            productSerial: _productSerial,
            ipfsCID: _ipfsCID,
            status: _status,
            productionDate: _productionDate,
            storeAddress: msg.sender
        });

        serials.push(_productSerial); // 將序號加入列表

        emit CertificateAdded(_productSerial, _ipfsCID, _productionDate, msg.sender);
    }

    // 查詢證書資料
    function getCertificate(string memory _productSerial)
        public
        view
        returns (
            string memory storeName,
            string memory productName,
            string memory productDescription,
            string memory productSerial,
            string memory ipfsCID,
            string memory status,
            uint256 productionDate,
            address storeAddress
        )
    {
        Certificate memory cert = certificates[_productSerial];

        // 如果找不到證書，返回默認值
        if (cert.productionDate == 0) {
            return ("", "", "", "", "", "", 0, address(0));
        }

        return (
            cert.storeName,
            cert.productName,
            cert.productDescription,
            cert.productSerial,
            cert.ipfsCID,
            cert.status,
            cert.productionDate,
            cert.storeAddress
        );
    }

    // 更新證書狀態
    function updateCertificateStatus(string memory _productSerial, string memory _newStatus) 
        public 
        onlyStoreOwner(_productSerial){
        Certificate storage cert = certificates[_productSerial];
        require(cert.productionDate > 0, "Certificate does not exist");
        cert.status = _newStatus;

        emit CertificateStatusUpdated(_productSerial, _newStatus, block.timestamp);
    }

    // 管理員撤銷證書
    function revokeCertificate(string memory _productSerial) public onlyAdmin {
        Certificate storage cert = certificates[_productSerial];
        require(cert.productionDate > 0, "Certificate does not exist");

        cert.status = "revoked";

        emit CertificateStatusUpdated(_productSerial, "revoked", block.timestamp);
    }

    // 基於產品序號驗證證書
    function verifyCertificate(string memory _productSerial) public view returns (bool, string memory) {
        Certificate memory cert = certificates[_productSerial];
        if (cert.productionDate == 0) {
            return (false, "Certificate does not exist");
        }
        if (keccak256(abi.encodePacked(cert.status)) != keccak256(abi.encodePacked("success"))) {
            return (false, "Certificate is not in a valid state");
        }
        return (true, "Certificate is valid");
    }

    // 基於 IPFS CID 驗證證書
    function verifyCertificateByCID(string memory _ipfsCID)
        public
        view
        returns (bool, string memory, string memory)
    {
        for (uint256 i = 0; i < serials.length; i++) {
            Certificate memory cert = certificates[serials[i]];

            if (keccak256(abi.encodePacked(cert.ipfsCID)) == keccak256(abi.encodePacked(_ipfsCID))) {
                if (keccak256(abi.encodePacked(cert.status)) != keccak256(abi.encodePacked("success"))) {
                    return (false, "Certificate is not in a valid state", "");
                }
                return (true, "Certificate is valid", cert.storeName);
            }
        }
        return (false, "Certificate does not exist", "");
    }
} 
