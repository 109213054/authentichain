require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    // 取得部署者的錢包
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);

    // 部署合約
    const MaticPriceOracle = await ethers.getContractFactory("MaticRateOracle");
    const oracle = await MaticPriceOracle.deploy();

    await oracle.waitForDeployment();

    console.log("MaticPriceOracle deployed to:", await oracle.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
