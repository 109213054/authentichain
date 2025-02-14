const hre = require("hardhat");

async function main() {
    console.log("📢 正在部署 SearchAndVerifyCert 合約...");

    //合約名稱
    const CertificateFunction = await hre.ethers.getContractFactory("SearchAndVerifyCert");

    // 部署合約
    const contract = await CertificateFunction.deploy();
    
    // 等待合約部署完成
    await contract.waitForDeployment();

    console.log("PaymentReceiver deployed to:", await contract.getAddress());
}

// 執行部署腳本
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });
