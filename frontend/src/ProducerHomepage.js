/* global BigInt */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from "ethers";
import "./ProducerHomepage.css";
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const ProducerHomepage = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    productName: '',
    productDescription: '',
    productSerial: '',
    productionDate: '',
  });

  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const fee = 0.001;
  const ORACLE_ABI = ["function getMaticPrice(string currency) external view returns (int256)"];
  const ORACLE_ADDRESS = process.env.REACT_APP_ORACLE_ADDRESS; // MaticPriceOracle 合約地址

  const [maticUsd, setMaticUsd] = useState(0);
  const [maticJpy, setMaticJpy] = useState(0);
  const [maticGbp, setMaticGbp] = useState(0);

  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 5000); // 每5秒更新匯率
    return () => clearInterval(interval);
  }, []);

  // 連接錢包並提取用戶地址
  const connectWallet = async () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAddress(accounts[0]);  // 設定用戶地址
        setWeb3(new Web3(window.ethereum));  // 設定 Web3 物件
        setMessage("錢包已連接！");
        setIsWalletConnected(true);
      } catch (error) {
          console.error("錢包連接失敗", error);
          setMessage("無法連接錢包，請重試！");
      }
    } else {
      setMessage("請安裝 MetaMask 錢包！");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //抓匯率
  const fetchExchangeRates = async () => {
    try {
      if (!window.ethereum) throw new Error("請連接 MetaMask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);

      const currencies = ["USD", "JPY", "GBP"];
      const exchangeRates = {};

      for (const currency of currencies) {
          console.log(`Fetching MATIC/${currency} price...`);
          try {
            
            const price=await oracle.getMaticPrice(currency);
              
              if (!price) {
                  console.error(`❌ MATIC/${currency} 返回 undefined`);
                  continue;
              }

              const formattedPrice = Number(ethers.formatUnits(price, 8));
              exchangeRates[currency] = formattedPrice;
          } catch (error) {
              console.error(`獲取 MATIC/${currency} 失敗:`, error);
          }
      }


      // 確保存入的數據是數字類型
      setMaticUsd(exchangeRates["USD"] || 0);
      setMaticJpy(exchangeRates["JPY"] || 0);
      setMaticGbp(exchangeRates["GBP"] || 0);

    } catch (error) {
      console.error("❌ 獲取匯率失敗:", error);
    }
  };
  

  // 提交表單，進行簽名並提交至後端
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!web3 || !address) {
      setMessage('請先連接錢包！');
      return;
    }
    
    const balance = await web3.eth.getBalance(address);
    if (Number(ethers.formatUnits(balance, 18)) < fee) {
      setMessage('MATIC 餘額不足，請加值後再試');
      return;
    }

    try {

        setMessage('正在檢查產品序號...');
        console.log('正在檢查產品序號...');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const SearchABI = [{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"getCertificate","outputs":[{"internalType":"bool","name":"","type":"bool"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_certificateHash","type":"string"},{"internalType":"bytes","name":"_certificateSignature","type":"bytes"}],"name":"addCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_newStatus","type":"string"}],"name":"updateCertificateStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"}];
        const contract = new ethers.Contract(process.env.REACT_APP_CERTIFICATE_ADDRESS, SearchABI, provider);
        const result = await contract.getCertificate(formData.productSerial);
        console.log(result);
        console.log(result[0]);
        if (result[0]) {
          setMessage('該產品序號已存在，請使用其他序號！');
          return;
        }
  

        const PAY_ABI =[{"inputs": [],"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "sender","type": "address"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}],"name": "PaymentReceived","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "owner","type": "address"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}],"name": "Withdraw","type": "event"},{"inputs": [],"name": "fee","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "owner","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "pay","outputs": [],"stateMutability": "payable","type": "function"},{"inputs": [],"name": "withdraw","outputs": [],"stateMutability": "nonpayable","type": "function"},{"stateMutability": "payable","type": "receive"}];
        const signer = await provider.getSigner();
        const PAYMONEY_CONTRACT = new ethers.Contract(process.env.REACT_APP_PAYMONEY_ADDRESS, PAY_ABI, signer);

        setMessage('正在處理付款...');
        const tx = await PAYMONEY_CONTRACT.pay({ value: ethers.parseEther("0.001") });
        await tx.wait(); // 等待交易確認
  
        //  2. 發送交易哈希給後端進行驗證
        setMessage('正在驗證交易...');
        const verifyResponse = await axios.post(`${API_BASE_URL}/api/verify-payment`, {
            transactionHash: tx.hash,
            userAddress: address,
        });
  
        if (!verifyResponse.data.success) {
            setMessage('交易驗證失敗: ' + verifyResponse.data.message);
            return;
        }

        setMessage('交易驗證成功，正在生成證書...');
        // 傳遞到後端
        const response = await axios.post(`${API_BASE_URL}/api/generate-certificate`, {
          ...formData,
          userAddress: address,
        });

        if (!response.data.ipfsCID) {
          setMessage('IPFS 上傳失敗');
          return;
        }

        const ipfsCID = response.data.ipfsCID;
        console.log("IPFS CID:", ipfsCID);
        

        // 生成 Hash
        const hashData = `${formData.storeName}|${formData.productName}|${formData.productDescription}|${formData.productSerial}|${formData.productionDate}|${ipfsCID}`;
        const hash = ethers.hashMessage(hashData);
        console.log("生成的 Hash值:", hash);

        // 🟢 用戶簽名
        setMessage('請使用 MetaMask 簽署原始資料及CID的雜湊值');
        const signature = await signer.signMessage(hash);

        setMessage('準備存入區塊鍊...');
        
        const productionDateTimestamp = Math.floor(new Date(formData.productionDate).getTime() / 1000);
        console.log("轉換 productionDate:", formData.productionDate, "➡", productionDateTimestamp);
        const status = "success";

        // 智能合約地址和 ABI
        const Cert_abi = [{"inputs":[{"internalType":"string","name":"_storeName","type":"string"},{"internalType":"string","name":"_productName","type":"string"},{"internalType":"string","name":"_productDescription","type":"string"},{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_ipfsCID","type":"string"},{"internalType":"uint256","name":"_productionDate","type":"uint256"},{"internalType":"string","name":"_status","type":"string"},{"internalType":"bytes32","name":"_certificateHash","type":"bytes32"},{"internalType":"bytes","name":"_certificateSignature","type":"bytes"}],"name":"addCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_newStatus","type":"string"}],"name":"updateCertificateStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"getCertificate","outputs":[{"internalType":"bool","name":"","type":"bool"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
        const CertcontractAddress = process.env.REACT_APP_CERTIFICATE_ADDRESS;
        const Certcontract = new ethers.Contract(CertcontractAddress, Cert_abi, signer);
  
        //存入區塊鏈
        const data = await Certcontract.addCertificate(
          formData.storeName,
          formData.productName,
          formData.productDescription,
          formData.productSerial,
          ipfsCID,
          productionDateTimestamp,
          status,
          hash,
          signature,
        );
        setMessage('正在存入區塊鍊，請稍後...');
        await data.wait(); // 等待交易完成
        setMessage('證書生成完成!');
        setLink(`您的證書 :  <a href="https://yellow-cheerful-herring-173.mypinata.cloud/ipfs/${ipfsCID}" target="_blank">點擊此處查看</a>`);
    } catch (error) {
      console.error('失敗', error);
      setMessage('失敗了');
    }
  };



return (
  <div className="producer-homepage">  {/* ✅ 主容器 */}
      <h2 className="matic-info">目前匯率</h2>
      <div className="matic-rates">
          <div className="matic-card">
              <p className="matic-card-title">MATIC/USD</p>
              <p className="matic-card-value">{maticUsd !== null ? maticUsd.toFixed(4) : "⏳ 加載中..."}</p>
              <p className="matic-card-currency">USD</p>
          </div>
          <div className="matic-card">
              <p className="matic-card-title">MATIC/JPY</p>
              <p className="matic-card-value">{maticJpy !== null ? maticJpy.toFixed(4) : "⏳ 加載中..."}</p>
              <p className="matic-card-currency">JPY</p>
          </div>
          <div className="matic-card">
              <p className="matic-card-title">MATIC/GBP</p>
              <p className="matic-card-value">{maticGbp !== null ? maticGbp.toFixed(4) : "⏳ 加載中..."}</p>
              <p className="matic-card-currency">GBP</p>
          </div>
      </div>

      <div className={`wallet-button-container ${isWalletConnected ? "hide" : "show"}`}>
          <button onClick={connectWallet} className="connect-wallet">連接metamask錢包</button>
      </div>
      {address && <p className="wallet-address">錢包地址: {address}</p>}
      <form onSubmit={handleSubmit}>
      <div className="form-group">
          <label htmlFor="storeName">店家名稱:</label>
          <input id="storeName" name="storeName" className="input-field" value={formData.storeName} onChange={handleChange} required />
      </div>

      <div className="form-group">
          <label htmlFor="productName">產品名稱:</label>
          <input id="productName" name="productName" className="input-field" value={formData.productName} onChange={handleChange} required />
      </div>

      <div className="form-group">
          <label htmlFor="productDescription">產品描述:</label>
          <textarea id="productDescription" name="productDescription" className="input-field" value={formData.productDescription} onChange={handleChange} required />
      </div>

      <div className="form-group">
          <label htmlFor="productSerial">產品序號:</label>
          <input id="productSerial" name="productSerial" className="input-field" value={formData.productSerial} onChange={handleChange} required />
      </div>

      <div className="form-group">
          <label htmlFor="productionDate">生產日期:</label>
          <input id="productionDate" name="productionDate" type="date" className="input-field" value={formData.productionDate} onChange={handleChange} required />
      </div>
      <div className="button-container">
          <button type="submit" className="submit-btn">支付 0.001 MATIC 並生成證書</button>
      </div>

      </form>
      
      {message && <p className="message">{message}</p>}
      <div dangerouslySetInnerHTML={{ __html: link }} className="certificate-link" /></div>
);
};

export default ProducerHomepage;
