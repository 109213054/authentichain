import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './app.css';
import ProducerHomepage from './ProducerHomepage';
import { ethers } from "ethers";

function App() {
  const [inputValue, setInputValue] = useState('');
  const [searchResult, setsearchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [link, setLink] = useState('');
  const [message,setMessage] = useState('');

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const searchCertificate = async () => {
      setMessage("");
      if (!window.ethereum) {
        alert("請安裝 MetaMask 錢包！");
        return;
      }
    
      if (!inputValue) {
          setErrorMessage("請輸入產品序號");
          return;
      }
    
      setErrorMessage("");
      setsearchResult(null);
    
      try {
          // 1 連接 MetaMask
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          if (!accounts.length) {
              setErrorMessage("請連接錢包後再查詢");
              return;
          }
    
          const abi = [{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"getCertificate","outputs":[{"internalType":"bool","name":"","type":"bool"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_certificateHash","type":"string"},{"internalType":"bytes","name":"_certificateSignature","type":"bytes"}],"name":"addCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"},{"internalType":"string","name":"_newStatus","type":"string"}],"name":"updateCertificateStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_productSerial","type":"string"}],"name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"}];
          // 2️ 與智能合約互動
          const contract = new ethers.Contract(process.env.REACT_APP_CERTIFICATE_ADDRESS, abi, provider);
          const result = await contract.getCertificate(inputValue);
          const [exists, status, storeName, productName, productDescription, ipfsCID, productionDate, storeAddress] = result;
    
          if (!exists) {
              setErrorMessage("未找到證書");
              return;
          }
    
          const formattedDate = new Date(Number(productionDate) * 1000).toLocaleDateString();
    
          // 3️ 顯示查詢結果
          setsearchResult({
              storeName,
              productName,
              productDescription,
              status,
              productionDate: formattedDate,  // 🟢 存入格式化後的日期
              storeAddress,
              transactionHash: `https://polygonscan.com/address/${storeAddress}`
          });
          setLink(`證書連結: <a href="https://yellow-cheerful-herring-173.mypinata.cloud/ipfs/${ipfsCID}" target="_blank">點擊這裡查看</a>`);
    
      } catch (error) {
          console.error("查詢錯誤:", error);
          setErrorMessage("查詢失敗，請稍後再試");
      }
  };

  const delCertificate = async () => {
    setMessage("🚀 撤銷證書按鈕已點擊！");
    if (!window.ethereum) {
        alert("請安裝 MetaMask 錢包！");
        return;
    }

    if (!inputValue) {
        setErrorMessage("請輸入產品序號");
        return;
    }

    setErrorMessage("");

    try {
        // 1️⃣ 連接 MetaMask
        setMessage("🔗 連接 MetaMask...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(); // 獲取使用者的帳戶
        const userAddress = await signer.getAddress(); // 取得當前用戶地址

        setMessage("👤 使用者地址:", userAddress);

        // 2️⃣ 智能合約 ABI & 地址
        const abi = [
            {
                "inputs": [{ "internalType": "string", "name": "_productSerial", "type": "string" }],
                "name": "revokeCertificate",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];
        const contractAddress = process.env.REACT_APP_CERTIFICATE_ADDRESS;
        setMessage("🔍 智能合約地址:", contractAddress);
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // 3️⃣ 檢查使用者是否為證書的擁有者
        if (!searchResult) {
            setMessage("⚠️ 先查詢證書再進行撤銷！");
            return;
        }

        const certificateOwner = searchResult.storeAddress.toLowerCase();
        console.log("🏪 證書擁有者:", certificateOwner);

        if (certificateOwner !== userAddress.toLowerCase()) {
            setMessage("⛔ 你沒有權限撤銷此證書！");
            return;
        }

        // 3️⃣ 執行撤銷證書交易
        setMessage("正在撤銷證書，請確認 MetaMask 交易...");
        const tx = await contract.revokeCertificate(inputValue);
        setMessage("⏳ 等待交易確認中...");
        await tx.wait(); // 等待交易完成

        setMessage(`證書已成功撤銷！交易哈希: ${tx.hash}`);

        // 4️⃣ 更新 UI，標記證書狀態為「revoked」
        if (searchResult) {
            setsearchResult({ ...searchResult, status: "revoked" });
        }

    } catch (error) {
        console.error("撤銷證書錯誤:", error);
        setMessage("撤銷證書失敗，請稍後再試！");
    }
  
  };
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="logo">AuthentiChain</div>
          <nav className="nav">
            <Link to="/producer" className="nav-link">店家入口</Link>
            <Link to="" className="nav-link">關於我們</Link>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1 className="title">證書查詢認證平台</h1>
                  <p className="subtitle">
                    基於區塊鏈技術,為每件商品提供唯一的數位身份
                  </p>

                  <div className="search-section">
                    <input 
                      type="text" 
                      className="search-input"
                      placeholder="輸入產品ID以查詢證書"
                      value={inputValue}
                      onChange={handleChange}
                    />
                    <button className="verify-btn" onClick={searchCertificate}>查詢證書</button>
                    {/*<button className="search-btn" onClick={delCertificate}>撤銷證書</button>*/}
                    
                  </div>
                  {/* 顯示訊息 */}
                  {message && <p className="message">{message}</p>}
                  {errorMessage && <p className="error-message">{errorMessage}</p>}
                  {searchResult && (
                    <div className="verification-result">
                    <button className="close-btn">&times;</button>
                    <h3>查詢結果</h3>
                      <p><strong>店家:</strong> {searchResult.storeName}</p>
                      <p><strong>產品名稱:</strong> {searchResult.productName}</p>
                      <p><strong>產品描述:</strong> {searchResult.productDescription}</p>
                      <p><strong>狀態:</strong> {searchResult.status}</p>
                      <div dangerouslySetInnerHTML={{ __html: link }} />
                      <p><strong>生成日期:</strong> {searchResult.productionDate}</p>
                      <p><strong>店家地址:</strong> {searchResult.storeAddress}</p>
                    </div>
                  )}
                </div>
              }
            />
            <Route path="/producer" element={<ProducerHomepage />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2025 AuthentiChain. All rights reserved.</p>
        </footer>
        
      </div>
    </Router>
  );
}

export default App;