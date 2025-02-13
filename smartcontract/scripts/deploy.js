const hre = require("hardhat");

async function main() {
  // 獲取合約工廠
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");

  // 部署合約
  const helloWorld = await HelloWorld.deploy();

  // 等待部署完成 waitForDeployment()
  await helloWorld.waitForDeployment();

  console.log("HelloWorld deployed to:",await helloWorld.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
