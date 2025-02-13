import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from "ethers";

const ProducerHomepage = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    productName: '',
    productDescription: '',
    productSerial: '',
    productionDate: '',
  });

  const [message, setMessage] = useState('');
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState('');
  const [maticPrice, setMaticPrice] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState("USD"); // 🟢 新增狀態：用戶選擇的貨幣
  const fee = 0.001;
  
  const ORACLE_ABI = [
    "function getMaticPrice(string currency) external view returns (int256)"
  ];
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
      } catch (error) {
          console.error("錢包連接失敗", error);
          setMessage("無法連接錢包，請重試！");
      }
    } else {
      setMessage("請安裝 MetaMask 錢包！");
    }
  };

  const handleCurrencyChange = (e) => { 
    setSelectedCurrency(e.target.value); // 設定用戶選擇的貨幣
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
            console.log(`🔍 currency: ${currency}, type: ${typeof currency}`);
            
            const price=await oracle.getMaticPrice("USD");
              
              if (!price) {
                  console.error(`❌ MATIC/${currency} 返回 undefined`);
                  continue;
              }

              const formattedPrice = Number(ethers.formatUnits(price, 8));
              exchangeRates[currency] = formattedPrice;
          } catch (error) {
              console.error(`⚠️ 獲取 MATIC/${currency} 失敗:`, error);
          }
      }

      console.log("🔍 匯率數據:", exchangeRates);

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
    //if (web3.utils.fromWei(balance, 'ether') < fee) {
    if (Number(ethers.formatUnits(balance, 18)) < fee) {
      setMessage('MATIC 餘額不足，請充值後再試');
      return;
    }


    try {
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS; //付款合約
        if (!contractAddress) {
          setMessage('合約地址未設定，請聯繫開發人員！');
          return;
        }
  
        const abi =[
          {"inputs": [],"stateMutability": "nonpayable","type": "constructor"},
          {"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "sender","type": "address"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}],"name": "PaymentReceived","type": "event"},
          {"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "owner","type": "address"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}],"name": "Withdraw","type": "event"},
          {"inputs": [],"name": "fee","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},
          {"inputs": [],"name": "owner","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},
          {"inputs": [],"name": "pay","outputs": [],"stateMutability": "payable","type": "function"},
          {"inputs": [],"name": "withdraw","outputs": [],"stateMutability": "nonpayable","type": "function"},
          {"stateMutability": "payable","type": "receive"}
        ];
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, signer);
        
        
  
  
        //  1. 發送支付交易
        setMessage('正在處理付款...');
        //const tx = await contract.pay({ value: ethers.utils.parseEther("0.001") });
        const tx = await contract.pay({ value: ethers.parseEther("0.001") });
        await tx.wait(); // 等待交易確認
        setMessage(`交易成功！交易哈希: ${tx.hash}`);
  
        //  2. 發送交易哈希給後端進行驗證
        setMessage('正在驗證交易...');
        const verifyResponse = await axios.post('http://localhost:5000/api/verify-payment', {
            transactionHash: tx.hash,
            userAddress: address,
        });
  
        if (!verifyResponse.data.success) {
            setMessage('交易驗證失敗: ' + verifyResponse.data.message);
            return;
        }
  
        setMessage('交易驗證成功，正在生成證書...');
        // 簽名的內容
        const payload = {
          ...formData,
          storeAddress: address,
          timestamp: Math.floor(Date.now() / 1000),
        };

        console.log('payload:',payload);
  
        // 使用用戶地址進行數位簽名
        const signature = await web3.eth.personal.sign(
          JSON.stringify(payload),
          address,
          ''
        );

        console.log("🚀 發送 /generate-certificate API 請求...");
  
        // 傳遞到後端
        const response = await axios.post('http://localhost:5000/api/generate-certificate', {
          ...payload,
          signature,
          transactionHash: tx.hash, //交易哈希
          userAddress: address, //新增使用者地址
        });

        console.log("✅ /generate-certificate 回應:", response.data);
  
        if (response.data.ipfsLink) {
          setMessage(`證書生成成功！下載連結: ${response.data.ipfsLink}`);
        } else {
          setMessage('生成證書成功，但無法取得下載連結。');
        }
    } catch (error) {
      console.error('生成證書失敗', error);
      setMessage('生成證書失敗，錯誤: ${error.message}');
    }
  };



return (
    <div>
      <h1>店家證書生成入口</h1>
      <button onClick={connectWallet}>連接錢包</button>
      {address && <p>已連接地址: {address}</p>}
       {/* 新增貨幣選擇下拉選單 */}
       <div>
        <label>選擇貨幣: </label>
        <select value={selectedCurrency} onChange={handleCurrencyChange}>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
      </div>
        <h1>📈 MATIC 匯率資訊</h1>
        {maticUsd !== null ? <p>💰 MATIC/USD: {maticUsd.toFixed(4)} USD</p> : <p>⏳ 加載 MATIC/USD 匯率...</p>}
        {maticJpy !== null ? <p>💴 MATIC/JPY: {maticJpy.toFixed(4)} JPY</p> : <p>⏳ 加載 MATIC/JPY 匯率...</p>}
        {maticGbp !== null ? <p>💷 MATIC/GBP: {maticGbp.toFixed(4)} GBP</p> : <p>⏳ 加載 MATIC/GBP 匯率...</p>}
        <form onSubmit={handleSubmit}>
        <div>
          <label>店家名稱:</label>
          <input
            type="text"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>產品名稱:</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>產品描述:</label>
          <textarea
            name="productDescription"
            value={formData.productDescription}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div>
          <label>產品序號:</label>
          <input
            type="text"
            name="productSerial"
            value={formData.productSerial}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>生產日期:</label>
          <input
            type="date"
            name="productionDate"
            value={formData.productionDate}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">支付 {fee} MATIC 並生成證書</button>
      </form>

      {message && <p>{message}</p>}
    </div>
);
};

export default ProducerHomepage;
