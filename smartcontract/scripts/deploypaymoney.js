const { ethers } = require("hardhat");

async function main() {
    const PaymentReceiver = await ethers.getContractFactory("PaymentReceiver");
    const contract = await PaymentReceiver.deploy();

    await contract.waitForDeployment();
    console.log("PaymentReceiver deployed to:", await contract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
