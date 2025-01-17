import React from 'react';
import './app.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">AuthentiChain</div>
        <nav className="nav">
          <a href="#" className="nav-link">驗證</a>
          <a href="#" className="nav-link">查詢</a>
          <a href="#" className="nav-link">關於</a>
        </nav>
      </header>

      <main className="main">
        <h1 className="title">商品真偽認證平台</h1>
        <p className="subtitle">
          基於區塊鏈技術,為每件商品提供唯一的數位身份
        </p>

        <div className="search-section">
          <input 
            type="text" 
            className="search-input"
            placeholder="輸入產品ID或CID進行驗證"
          />
          <button className="verify-btn">
            驗證商品
          </button>
          <button className="search-btn">
            查詢商品
          </button>
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 AuthentiChain. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

