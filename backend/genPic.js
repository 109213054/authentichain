import express from 'express';
import { createCanvas, registerFont } from 'canvas';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { ethers } from "ethers";
import axios from "axios";
import FormData from "form-data";

dotenv.config();
const router = express.Router();

// 註冊字體，避免中文亂碼
registerFont('./fonts/NotoSansTC-Regular.ttf', { family: 'Noto Sans TC' });


// 初始化 ethers.js 提供者（連接 Polygon 區塊鏈）
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

async function generateCertificateImage(data) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, canvas.width, canvas.height);
  drawBorder(ctx, canvas.width, canvas.height);
  drawTitle(ctx, canvas.width);
  drawContent(ctx, data);
  drawStamp(ctx, canvas.width, canvas.height);

  return canvas.toBuffer('image/png');
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.35, '#E6F3FF');
  gradient.addColorStop(0.85, '#B3D9FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawBorder(ctx, width, height) {
  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, width - 20, height - 20);
}

function drawTitle(ctx, width) {
  ctx.font = 'bold 40px "Noto Sans TC"';
  ctx.fillStyle = '#2C3E50';
  ctx.textAlign = 'center';
  ctx.fillText('產品認證證書', width / 2, 80);
}

function drawContent(ctx, data) {
  const leftMargin = 120; // 增加左邊距
  const contentStartY = 150;
  const lineHeight = 45;
  const labelWidth = 100;
  const maxWidth = 560; // 調整最大寬度以適應新的左邊距

  ctx.font = '20px "Noto Sans TC"';
  ctx.fillStyle = '#34495E';
  ctx.textAlign = 'left';

  let currentY = contentStartY;

  const fields = [
    { label: '店家名稱:', value: data.storeName },
    { label: '產品名稱:', value: data.productName },
    { label: '產品描述:', value: data.productDescription, multiline: true },
    { label: '產品序號:', value: data.productSerial },
    { label: '生產日期:', value: data.productionDate }
  ];

  fields.forEach(field => {
    ctx.fillText(field.label, leftMargin, currentY);
    if (field.multiline) {
      currentY = wrapText(ctx, field.value, leftMargin + labelWidth, currentY, maxWidth - labelWidth, lineHeight);
    } else {
      ctx.fillText(field.value, leftMargin + labelWidth, currentY);
    }
    currentY += lineHeight;
  });
}

function drawStamp(ctx, width, height) {
  const stampX = width - 150;
  const stampY = height - 150;
  const stampRadius = 60;
  const innerRadius = stampRadius - 25;

  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#FF0000';
  ctx.fillStyle = '#FF0000';

  // 外圈
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampRadius, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.stroke();

  // 內圈
  ctx.beginPath();
  ctx.arc(stampX, stampY, innerRadius, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 外圈文字 (AUTHENTICHAIN)
  ctx.font = '16px "Noto Sans TC"';
  ctx.textAlign = 'center';
  const text = 'AUTHENTICHAIN';
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.rotate(i * (Math.PI * 2 / text.length) - Math.PI / 2);
    ctx.fillText(text[i], 0, -stampRadius + 20);
    ctx.restore();
  }

  // 畫一個簡單的區塊鏈圖案
  ctx.beginPath();
  ctx.moveTo(stampX - 20, stampY);
  ctx.lineTo(stampX + 20, stampY);
  ctx.moveTo(stampX - 10, stampY + 15);
  ctx.lineTo(stampX + 10, stampY + 15);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const characters = text.split('');
  let line = '';
  let currentY = y;

  for (let i = 0; i < characters.length; i++) {
    const testLine = line + characters[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth) {
      ctx.fillText(line, x, currentY);
      line = characters[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);

  return currentY;
}

// 定義路由
router.post('/verify-payment', async (req, res) => {
  try {
      const CONTRACT_ADDRESS = process.env.PAYMONEY_CONTRACT_ADDRESS;
      const { transactionHash, userAddress } = req.body;
      if (!transactionHash || !userAddress) {
          return res.status(400).json({ success: false, message: "缺少必要的交易資訊。" });
      }
  
      //驗證交易是否成功
      console.log(`🔍 驗證交易: ${transactionHash}`);
      //透過 provider 查詢交易
      const receipt = await provider.getTransactionReceipt(transactionHash);
      console.log('receipt:',receipt);
      if (!receipt || receipt.status !== 1) {
          return res.status(400).json({ success: false, message: "交易失敗或未確認。" });
      }
  
      //驗證交易是否發送到正確的合約
      if (receipt.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
          return res.status(400).json({ success: false, message: "交易目標地址錯誤。" });
      }

      // 智能合約地址和 ABI
      const paymentAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"PaymentReceived","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"fee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pay","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
      const paymentContract = new ethers.Contract(CONTRACT_ADDRESS, paymentAbi, provider);
      
      //解析交易記錄（Logs），檢查 PaymentReceived 事件
      const logs = receipt.logs.map(log => {
          try {
              return paymentContract.interface.parseLog(log);
          } catch (error) {
              //如果這筆交易沒有觸發 PaymentReceived 事件，代表這不是一筆付款交易，則驗證失敗
              console.error("解析交易記錄失敗:", error);
              return null;
          }
      }).filter(log => log && log.name === "PaymentReceived");

  
      if (logs.length === 0) {
          return res.status(400).json({ success: false, message: "交易未觸發付款事件。" });
      }
      
      //確保交易金額足夠
      const paymentEvent = logs[0];
      const amountPaid = ethers.formatEther(paymentEvent.args.amount);
      const requiredFee = ethers.formatEther(await paymentContract.fee());

      if (parseFloat(amountPaid) < parseFloat(requiredFee)) {
          return res.status(400).json({ success: false, message: "支付金額不足。" });
      }
  
      return res.json({ success: true, message: "付款驗證成功。" });

  } catch (error) {
      console.error("❌ 付款驗證錯誤:", error);
      return res.status(500).json({ success: false, message: "伺服器錯誤，請稍後再試。" });
  }
});

router.post('/generate-certificate', async (req, res) => {
    console.log("收到 /generate-certificate API 請求");
    try {
        const {
          storeName,
          productName,
          productDescription,
          productSerial,
          productionDate,
          userAddress // 新增用戶地址來驗證交易
        } = req.body;

        console.log("storeName:", storeName);
        console.log("productName:", productName);
    
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
          ipfsLink = `https://yellow-cheerful-herring-173.mypinata.cloud/ipfs/${ipfsCID}`;
          console.log("Public IPFS Link:", ipfsLink);
        } catch (error) {
          console.error("IPFS upload error:", error);
          return res.status(500).json({ message: 'IPFS 上傳失敗' });
        }

        // 送 `CID` 給前端，讓用戶簽名
        res.status(200).json({
          message: 'IPFS 上傳成功，請使用者簽名',
          ipfsCID,
          ipfsLink,
          userAddress // ✅ 加上 userAddress，後端 `store-certificate` 需要用這個來驗證
        });
        
      } catch (error) {
        console.error("❌ 生成證書錯誤:", error);
        res.status(500).json({ message: '生成證書時發生錯誤' });
    }
});

export default router;
