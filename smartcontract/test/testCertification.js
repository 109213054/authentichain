const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateStorage Contract", function () {
    let CertificateStorage;
    let certificateStorage;
    let owner;
    let storeOwner;
    let otherAccount;

    beforeEach(async function () {
        [owner, storeOwner, otherAccount] = await ethers.getSigners();
        CertificateStorage = await ethers.getContractFactory("CertificateStorage");
        certificateStorage = await CertificateStorage.deploy();
        await certificateStorage.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right admin", async function () {
            expect(await certificateStorage.admin()).to.equal(owner.address);
        });
    });

    describe("新增證書", function () {
        it("允許店家新增一份證書到區塊鏈上", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            const cert = await certificateStorage.getCertificate("12345-ABCDE");
            expect(cert.storeName).to.equal("Demo Store");
            expect(cert.productName).to.equal("Demo Product");
            expect(cert.status).to.equal("success");
        });

        it("Should not allow adding a certificate with an existing serial number", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            await expect(
                certificateStorage.connect(storeOwner).addCertificate(
                    "Demo Store",
                    "Another Product",
                    "This is another product.",
                    "12345-ABCDE",
                    "QmAnotherCID",
                    Math.floor(Date.now() / 1000),
                    "success"
                )
            ).to.be.revertedWith("Product serial already exists");
        });
    });

    describe("更新證書狀態", function () {
        it("允許證書的店家更新證書的狀態，例如將狀態從 pending 更新為 success 或 revoked", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            await certificateStorage.connect(storeOwner).updateCertificateStatus(
                "12345-ABCDE",
                "revoked"
            );

            const cert = await certificateStorage.getCertificate("12345-ABCDE");
            expect(cert.status).to.equal("revoked");
        });

        it("只有店家可以更新狀態", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            await expect(
                certificateStorage.connect(otherAccount).updateCertificateStatus(
                    "12345-ABCDE",
                    "revoked"
                )
            ).to.be.revertedWith("Only the store owner can perform this action");
        });
    });

    describe("撤銷證書", function () {
        it("允許合約的管理員撤銷某份證書，將其狀態設為 revoked", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            await certificateStorage.connect(owner).revokeCertificate("12345-ABCDE");

            const cert = await certificateStorage.getCertificate("12345-ABCDE");
            expect(cert.status).to.equal("revoked");
        });

        it("只有管理員可以撤銷證書", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            await expect(
                certificateStorage.connect(otherAccount).revokeCertificate("12345-ABCDE")
            ).to.be.revertedWith("Only admin can perform this action");
        });
    });

    describe("基於產品序號驗證證書", function () {
        it("驗證一份證書是否存在且有效", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            const [isValid, reason] = await certificateStorage.verifyCertificate("12345-ABCDE");
            expect(isValid).to.be.true;
            expect(reason).to.equal("Certificate is valid");
        });

        it("基於 IPFS CID 驗證證書 ", async function () {
            await certificateStorage.connect(storeOwner).addCertificate(
                "Demo Store",
                "Demo Product",
                "This is a demo product.",
                "12345-ABCDE",
                "QmExampleCID",
                Math.floor(Date.now() / 1000),
                "success"
            );

            const [isValid, reason, storeName] = await certificateStorage.verifyCertificateByCID("QmExampleCID");
            expect(isValid).to.be.true;
            expect(reason).to.equal("Certificate is valid");
            expect(storeName).to.equal("Demo Store");
        });

        it("Should return false for a non-existent certificate", async function () {
            const [isValid, reason] = await certificateStorage.verifyCertificate("NonExistentSerial");
            expect(isValid).to.be.false;
            expect(reason).to.equal("Certificate does not exist");
        });
    });
});
