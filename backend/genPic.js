import express from 'express';
import mongoose from 'mongoose';
import { createCanvas, registerFont } from 'canvas';
import Web3 from 'web3';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { PinataSDK } from "pinata";
import { ethers } from "ethers";
import abi from './abi/CertificateStorage.json' with { type: 'json' };
import fs from 'fs';
import axios from "axios";
import FormData from "form-data";

dotenv.config();

const router = express.Router();

// 註冊字體，避免中文亂碼
registerFont('./fonts/NotoSansTC-Regular.ttf', { family: 'Noto Sans TC' });

// 初始化 IPFS 客戶端
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

//初始化web3
const web3 = new Web3(process.env.POLYGON_RPC_URL);
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 智能合約地址和 ABI
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, abi, wallet);

// MongoDB 模型
const certificateSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  productName: { type: String, required: true },
  productDescription: { type: String, required: true },
  productSerial: { type: String, required: true, unique: true },
  productionDate: { type: String, required: true },
  ipfsCID: { type: String, required: true },
  ipfsLink: { type: String, required: true },
  blockchainTransactionHash: { type: String, required: true },
  status: { type: String, default: 'success' }, // pending
  //timestamp: { type: Number, required: true },
});

const Certificate = mongoose.model('Certificate', certificateSchema);

//交易手續費
const fee = 0.001;

// 圖片生成函數
async function generateCertificateImage(data) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.35, '#E6F3FF');
  gradient.addColorStop(0.85, '#B3D9FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.font = 'bold 40px "Noto Sans TC"';
  ctx.fillStyle = '#2C3E50';
  ctx.textAlign = 'center';
  ctx.fillText('產品認證證書', canvas.width / 2, 80);

  ctx.font = '20px "Noto Sans TC"';
  ctx.fillStyle = '#34495E';
  ctx.textAlign = 'center';
  const startY = 150;
  const lineHeight = 40;

  const lines = [
    `店家名稱: ${data.storeName}`,
    `產品名稱: ${data.productName}`,
    `產品描述: ${data.productDescription}`,
    `產品序號: ${data.productSerial}`,
    `生產日期: ${data.productionDate}`,
  ];

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  return canvas.toBuffer('image/png');
}

// 定義路由
router.post('/generate-certificate', async (req, res) => {
    console.log("🔵 1. 收到 /generate-certificate API 請求");
    try {
        const {
          storeName,
          productName,
          productDescription,
          productSerial,
          productionDate,
          transactionHash,
          //userAddress // 新增用戶地址來驗證交易
        } = req.body;

        console.log("🔵 2. storeName:", storeName);
        console.log("🔵 3. productName:", productName);
        console.log("🔵 4. transactionHash:", transactionHash);
    
    
        //生成圖片
        const imageBuffer = await generateCertificateImage({
          storeName,
          productName,
          productDescription,
          productSerial,
          productionDate,
        });
        console.log(imageBuffer);
    
        // 上傳到 IPFS
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

        // 轉換 imageBuffer 為 Readable Stream
        const stream = Readable.from(imageBuffer);

        // 建立 FormData 來傳送文件
        const formData = new FormData();
        formData.append("file", stream, { filename: `${productSerial}.png` });

        // 設置 metadata
        const pinataMetadata = JSON.stringify({
          name: `${productSerial}.png`,
        });
        formData.append("pinataMetadata", pinataMetadata);

        // 設置 pinataOptions
        const pinataOptions = JSON.stringify({
          cidVersion: 0,
        });
        formData.append("pinataOptions", pinataOptions);
        let ipfsCID = "";
        let ipfsLink = "";
        try {
          const upload = await axios.post(url, formData, {
            headers: {
              ...formData.getHeaders(),
              pinata_api_key: process.env.PINATA_API_KEY,
              pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            },
          });
        
          // 取得 IPFS CID
          ipfsCID = upload.data.IpfsHash;
          console.log("IPFS CID:", ipfsCID);
        
          // 產生 Public IPFS 連結
          ipfsLink = `https://ipfs.io/ipfs/${ipfsCID}`;
          console.log("Public IPFS Link:", ipfsLink);
        } catch (error) {
          console.error("IPFS upload error:", error);
        }


        // 計算 SHA256 證書 Hash
        /*
        const hashInput = `${storeName}${productName}${productDescription}${productSerial}${productionDate}${ipfsCID}`;
        const certificateHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        console.log('certificateHash:', certificateHash);*/
    
        //存入區塊鏈
        const tx = await contract.addCertificate(
          storeName,
          productName,
          productDescription,
          productSerial,
          ipfsCID,
          Math.floor(new Date(productionDate).getTime() / 1000), // 轉換為 UNIX 時間戳
          'successful'
        );
        await tx.wait(); // 等待交易完成
    
        const blockchainTransactionHash = tx.hash;
        console.log('blockchainTransactionHash:',blockchainTransactionHash);
        
        //保存到MongoDB 
        const newCertificate = new Certificate({
          storeName,
          productName,
          productDescription,
          productSerial,
          productionDate,
          ipfsCID,
          ipfsLink,
          blockchainTransactionHash, // 儲存交易哈希
          //timestamp,
        });
        
        await newCertificate.save();
        
    
        res.status(200).json({
          message: '證書生成成功',
          ipfsCID,
          ipfsLink,
          blockchainTransactionHash,
        });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '生成證書時發生錯誤' });
    }
});


router.post('/verify-payment', async (req, res) => {
  try {
      const CONTRACT_ADDRESS = process.env.PAYMONEY_CONTRACT_ADDRESS;
      console.log('ContractAddress: ',CONTRACT_ADDRESS)
      const { transactionHash, userAddress } = req.body;
      if (!transactionHash || !userAddress) {
          return res.status(400).json({ success: false, message: "缺少必要的交易資訊。" });
      }
  
      console.log(`🔍 驗證交易: ${transactionHash}`);
  
      const receipt = await provider.getTransactionReceipt(transactionHash);

      console.log('receipt:',receipt);
      if (!receipt || receipt.status !== 1) {
          return res.status(400).json({ success: false, message: "交易失敗或未確認。" });
      }
  
      if (receipt.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
          return res.status(400).json({ success: false, message: "交易目標地址錯誤。" });
      }

      console.log("1.🔍 receipt.logs:", receipt.logs);
      console.log("2.🔍 receipt.to:", receipt.to);

      // 智能合約地址和 ABI
      const paymentAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"PaymentReceived","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"fee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pay","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
      const paymentContract = new ethers.Contract(CONTRACT_ADDRESS, paymentAbi, provider);
  
      const logs = receipt.logs.map(log => {
          try {
              const parsedLog = paymentContract.interface.parseLog(log);
              console.log("✅ 解析成功的 Log:", parsedLog);
              return paymentContract.interface.parseLog(log);
          } catch (error) {
              console.error("🚨 解析交易記錄失敗:", error);
              console.log("🚨 無法解析的 Log:", log);
              return null;
          }
      }).filter(log => log && log.name === "PaymentReceived");

      console.log('log:',logs);
  
      if (logs.length === 0) {
          return res.status(400).json({ success: false, message: "交易未觸發付款事件。" });
      }
  
      const paymentEvent = logs[0];

      console.log('paymentEvent:',paymentEvent);
      const amountPaid = ethers.formatEther(paymentEvent.args.amount);
      const requiredFee = ethers.formatEther(await paymentContract.fee());
  
      console.log(`🟢 確認支付: ${amountPaid} MATIC / 需支付: ${requiredFee} MATIC`);
  
      if (parseFloat(amountPaid) < parseFloat(requiredFee)) {
          return res.status(400).json({ success: false, message: "支付金額不足。" });
      }
  
      return res.json({ success: true, message: "付款驗證成功。" });

  } catch (error) {
      console.error("❌ 付款驗證錯誤:", error);
      return res.status(500).json({ success: false, message: "伺服器錯誤，請稍後再試。" });
  }
});


export default router;
