const { expect } = require("chai");
const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes } = ethers;
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("CertificateFunction Contract", function () {
  let CertificateFunction, contract, owner, storeOwner, otherAccount;

  beforeEach(async function () {
    [owner, storeOwner, otherAccount] = await ethers.getSigners();
    CertificateFunction = await ethers.getContractFactory("CertificateFunction");
    contract = await CertificateFunction.deploy();
  });

  it("應該允許店家更新證書狀態", async function () {
    const productSerial = "A12345";

    // 先新增證書
    await contract.connect(storeOwner).addCertificate(
      "Store A",
      "Product X",
      "High quality product",
      productSerial,
      "Qm123abc",
      Math.floor(Date.now() / 1000),
      "success",
      keccak256(toUtf8Bytes("testData")),
      "0x"
    );

    // ✅ 確保狀態允許變更
    await contract.connect(storeOwner).updateCertificateStatus(productSerial, "pending");

    // ✅ 更新狀態
    await expect(
      contract.connect(storeOwner).updateCertificateStatus(productSerial, "success")
    ).to.emit(contract, "CertificateStatusUpdated");

    // ✅ 驗證是否更新
    const certificate = await contract.getCertificate(productSerial);
    expect(certificate[1]).to.equal("success"); // 應該為 "success"
  });

  it("應該允許店家撤銷自己的證書", async function () {
    const productSerial = "A12345";

    await contract.connect(storeOwner).addCertificate(
      "Store A",
      "Product X",
      "High quality product",
      productSerial,
      "Qm123abc",
      Math.floor(Date.now() / 1000),
      "success",
      keccak256(toUtf8Bytes("testData")),
      "0x"
    );

    await expect(contract.connect(storeOwner).revokeCertificate(productSerial))
      .to.emit(contract, "CertificateStatusUpdated")
      .withArgs(productSerial, "revoked", anyValue);
  });

  it("應該允許管理員撤銷證書", async function () {
    const productSerial = "A12345";

    await contract.connect(storeOwner).addCertificate(
      "Store A",
      "Product X",
      "High quality product",
      productSerial,
      "Qm123abc",
      Math.floor(Date.now() / 1000),
      "success",
      keccak256(toUtf8Bytes("testData")),
      "0x"
    );

    await expect(contract.connect(owner).revokeCertificate(productSerial))
      .to.emit(contract, "CertificateStatusUpdated")
      .withArgs(productSerial, "revoked", anyValue);
  });
});
