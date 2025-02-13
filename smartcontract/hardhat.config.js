require("@nomicfoundation/hardhat-toolbox");
//require("@chainlink/contracts");
require("dotenv").config(); // 用於加載 .env 中的環境變數

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.0", // 與智能合約版本兼容
    settings: {
      optimizer: {
        enabled: false, // 默認禁用優化器
        runs: 200,      // 優化運行次數
      },
    },
  },
  networks: {
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY], // 用您的 MetaMask 私人金鑰取代
      //gasPrice: 30000000000,
    },
  },

  etherscan: {
    apiKey: {
      polygonMumbai: "BFQ6D51F6Q87EB8MXJ8AIARCQJ6AQNINED", // 替換為你的 Polygonscan API 金鑰
    },
  },
};
