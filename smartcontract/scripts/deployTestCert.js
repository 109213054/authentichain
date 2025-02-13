const { ethers } = require("hardhat");

async function main() {
    // 獲取合約工廠
    const CertificateStorage = await ethers.getContractFactory("CertificateStorage");

    // 部署合約
    console.log("Deploying CertificateStorage contract...");
    const certificateStorage = await CertificateStorage.deploy();

    // 等待合約部署完成
    await certificateStorage.waitForDeployment();

    // 輸出部署的合約地址
    console.log("CertificateStorage contract deployed to:",await certificateStorage.getAddress());
}

// 處理異步執行和錯誤捕獲
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contract:", error);
        process.exit(1);
    });
