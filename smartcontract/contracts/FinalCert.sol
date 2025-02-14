// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract SearchAndVerifyCert {
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
        bytes32 certificateHash; //雜湊值
        bytes certificateSignature; //店家對資料的簽名
    }

    // 管理員地址
    address public admin;

    // 事件，用於記錄新增的證書
    event CertificateAdded(
        string productSerial,
        string ipfsCID,
        uint256 timestamp,
        address indexed storeAddress,
        bytes32 certificateHash, 
        bytes certificateSignature
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
        require(certificates[_productSerial].storeAddress != address(0), "Certificate does not exist");
        require(certificates[_productSerial].storeAddress == msg.sender, "Only the store owner can perform this action");
        _;
    }

    // 合約構造函數
    constructor() {
        admin = msg.sender;//部署合約的帳戶
    }


    // 新增證書資料
    function addCertificate(
        string memory _storeName,
        string memory _productName,
        string memory _productDescription,
        string memory _productSerial,
        string memory _ipfsCID,
        uint256 _productionDate,
        string memory _status,
        bytes32 _certificateHash,
        bytes memory _certificateSignature
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
            storeAddress: msg.sender,
            certificateHash: _certificateHash,
            certificateSignature: _certificateSignature 
        });

        serials.push(_productSerial); // 將序號加入列表

        emit CertificateAdded(_productSerial, _ipfsCID, _productionDate, msg.sender, _certificateHash, _certificateSignature);
    }

    // 透過 `productSerial` 查詢證書
    function getCertificate(string memory _productSerial) public view 
        returns (bool, string memory, string memory, string memory, string memory, string memory, uint256, address)
    {
        Certificate memory cert = certificates[_productSerial];
    
        // 1️ 確保證書存在
        if (cert.productionDate == 0) {
            return (false, "Certificate does not exist", "", "", "", "", 0, address(0));
        }
        return (true, cert.status, cert.storeName, cert.productName, cert.productDescription, cert.ipfsCID, cert.productionDate, cert.storeAddress);
    }

} 
