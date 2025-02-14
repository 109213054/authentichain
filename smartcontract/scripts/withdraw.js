require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // 🟢 替換為你的合約地址
    const contractAddress = process.env.PAYMONEY_CONTRACT_ADDRESS; 

    // 🟢 定義合約 ABI
    const contractABI = [
        "function withdraw() external"
    ];

    // 🟢 連接合約
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    console.log(`📢 合約地址: ${contractAddress}`);
    console.log(`💰 提款發起者: ${wallet.address}`);

    // 🟢 執行 withdraw()
    const tx = await contract.withdraw();
    console.log(`⏳ 交易發送中... ${tx.hash}`);

    if (!tx || !tx.hash) {
        throw new Error("❌ 交易哈希為 undefined，可能是交易失敗或 RPC 問題");
    }
    
    console.log(`🔗 交易哈希: ${tx.hash}`);

    // 等待交易確認
    const receipt = await tx.wait();

    if (!receipt) {
        throw new Error("❌ 交易未確認，請稍後再試");
    }
    console.log(`✅ 提款成功！交易哈希: ${receipt.transactionHash}`);
}

main().catch((error) => {
    console.error("❌ 發生錯誤:", error);
    process.exit(1);
});
