require("@nomicfoundation/hardhat-toolbox");
//require("@chainlink/contracts");
require("dotenv").config(); // 用於加載 .env 中的環境變數

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
    },
  },
  networks: {
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY], // 用MetaMask私鑰取代
    },
  },

  etherscan: {
    apiKey: {
      polygon:"BFQ6D51F6Q87EB8MXJ8AIARCQJ6AQNINED", // 換成 Polygonscan API 金鑰
    },
  },
};
