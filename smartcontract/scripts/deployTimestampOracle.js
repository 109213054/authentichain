const hre = require("hardhat");

async function main() {
  console.log("🔹 部署 TimestampOracle 合約...");

  // 編譯合約
  const TimestampOracle = await hre.ethers.getContractFactory("TimestampOracle");
  const oracle = await TimestampOracle.deploy();

  await oracle.waitForDeployment(); // 等待合約部署完成
  const oracleAddress = await oracle.getAddress();

  console.log(`✅ TimestampOracle 已部署，合約地址: ${oracleAddress}`);

  // 建立 .env 設定檔案
  console.log("✍️  更新 .env 檔案...");
  const fs = require("fs");
  fs.appendFileSync("../.env", `\nTIMESTAMP_ORACLE_CONTRACT=${oracleAddress}\n`);

  console.log("🚀 部署完成！請將 `TIMESTAMP_ORACLE_CONTRACT` 更新到前端和後端。");
}

// 執行部署腳本
main().catch((error) => {
  console.error("❌ 部署失敗:", error);
  process.exitCode = 1;
});
