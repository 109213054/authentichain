import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './app.css';
import ProducerHomepage from './ProducerHomepage';
//import Transaction from './Transaction';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const verifyCertificate = async () => {
    if (!inputValue) {
      setErrorMessage('請輸入產品 ID 或 CID');
      return;
    }
    setErrorMessage('');
    setVerificationResult(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/verify-certificate', {
        cidOrProductId: inputValue,
      });
      setVerificationResult(response.data);
    } catch (error) {
      setErrorMessage('驗證失敗，請確認輸入是否正確');
    }
  };
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="logo">AuthentiChain</div>
          <nav className="nav">
            <Link to="/producer" className="nav-link">店家入口</Link>
            <Link to="/producer" className="nav-link">關於我們</Link>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1 className="title">商品真偽認證平台</h1>
                  <p className="subtitle">
                    基於區塊鏈技術,為每件商品提供唯一的數位身份
                  </p>

                  <div className="search-section">
                    <input 
                      type="text" 
                      className="search-input"
                      placeholder="輸入產品ID或CID進行驗證"
                      value={inputValue}
                      onChange={handleChange}
                    />
                    <button className="verify-btn" onClick={verifyCertificate}>
                      驗證商品
                    </button>
                    <button className="search-btn">
                      查詢商品
                    </button>
                  </div>
                  {errorMessage && <p className="error-message">{errorMessage}</p>}
                  {verificationResult && (
                    <div className="verification-result">
                      <h3>驗證結果</h3>
                      <p><strong>店家:</strong> {verificationResult.storeName}</p>
                      <p><strong>產品名稱:</strong> {verificationResult.productName}</p>
                      <p><strong>產品描述:</strong> {verificationResult.productDescription}</p>
                      <p><strong>狀態:</strong> {verificationResult.status}</p>
                      <img src={verificationResult.ipfsLink} alt="產品證書" className="certificate-image" />
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