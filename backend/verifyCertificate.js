import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import abi from './abi/CertificateStorage.json' with { type: 'json' };

dotenv.config();

const router = express.Router();

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
  status: { type: String, default: 'success' },
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// 初始化 Web3 和合約
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

// 查詢證書真偽
router.post('/verify-certificate', async (req, res) => {
  try {
    const { cidOrProductId } = req.body;

    if (!cidOrProductId) {
      return res.status(400).json({ message: '請提供 CID 或產品序號' });
    }

    // 先從 MongoDB 查詢
    const certificate = await Certificate.findOne({
      $or: [{ ipfsCID: cidOrProductId }, { productSerial: cidOrProductId }],
    });

    if (!certificate) {
      return res.status(404).json({ message: '未找到對應的證書' });
    }

    // 從區塊鏈合約驗證是否存在
    const storedCID = await contract.getCertificateCID(certificate.productSerial);
    
    if (storedCID !== certificate.ipfsCID) {
      return res.status(400).json({ message: '區塊鏈數據不匹配，可能是假證書' });
    }

    res.status(200).json({
      storeName: certificate.storeName,
      productName: certificate.productName,
      productDescription: certificate.productDescription,
      productSerial: certificate.productSerial,
      productionDate: certificate.productionDate,
      ipfsCID: certificate.ipfsCID,
      ipfsLink: certificate.ipfsLink,
      blockchainTransactionHash: certificate.blockchainTransactionHash,
      status: certificate.status,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '驗證時發生錯誤' });
  }
});

export default router;
