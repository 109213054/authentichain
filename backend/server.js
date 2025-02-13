import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connect } from 'mongoose';
import genPicRoutes from './genPic.js'; // 使用 ESM 模組導入
import verifyCertificate from './genPic.js';
import verifyPayment from './genPic.js';
import storeCertificate from './genPic.js';

// 初始化環境變數
config();

// 創建 Express 應用
const app = express();

// 使用中介軟件
app.use(cors());
app.use(bodyParser.json()); // 使用 body-parser 的 JSON 解析
app.use(bodyParser.urlencoded({ extended: true })); // 使用 body-parser 的 URL-encoded 解析

// 設定基礎路由
app.get('/', (req, res) => {
  res.send('後端服務已啟動');
});

// 後端生成圖片
app.use('/api', genPicRoutes);
//驗證證書
app.use('/api', verifyCertificate);
//paymoney
app.use('/api', verifyPayment);
app.use('/api', storeCertificate);

// MongoDB 連線
const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log('MongoDB 已成功連線');
  } catch (error) {
    console.error('MongoDB 連線失敗:', error.message);
    process.exit(1);
  }
};

// 啟動服務
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服務正在執行於 http://localhost:${PORT}`);
  connectDB(); // 啟動時連線資料庫
});
