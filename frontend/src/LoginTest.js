import React, { useState } from 'react';
import axios from 'axios';
import Web3 from 'web3';

const ProducerHomepage = () => {
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [message] = useState('Verify your identity');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 創建 Web3 實例
        const web3 = new Web3(window.ethereum);
        
        // 請求用戶授權連接錢包
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        console.log('Connected account:', accounts[0]);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const signMessage = async () => {
    if (!address) {
      alert('Please connect your wallet first!');
      return;
    }
    const web3 = new Web3(window.ethereum);
    try {
      const userSignature = await web3.eth.personal.sign(message, address, '');
      setSignature(userSignature);
      console.log('Signature:', userSignature);
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  const submitData = async () => {
    if (!signature || !address) {
      alert('Please sign the message first!');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/verify', {
        address,
        signature,
        message,
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };
/*
  //連接錢包
  const connectWallet = async () => {
    // 檢查是否存在 Ethereum 物件（MetaMask 或其他兼容錢包）
    if (window.ethereum && window.ethereum.isMetaMask) {
      try {
        // 創建 Web3 實例
        const web3Instance = new Web3(window.ethereum);
  
        // 請求用戶授權連接錢包
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        // 獲取帳戶地址
        const accounts = await web3Instance.eth.getAccounts();
        if (!accounts || accounts.length === 0) {
          setMessage('無法獲取帳戶地址，請確認已連接並授權 MetaMask！');
          return;
        }
  
        // 生成數位簽名
        const messageToSign = '這是測試簽名的訊息';
        const signature = await web3Instance.eth.personal.sign(
          messageToSign,
          accounts[0],
          '' // 空密碼，適用於大多數情況
        );
  
        // 印出帳戶地址和簽名
        console.log('帳戶地址:', accounts[0]);
        console.log('簽名:', signature);
  
        // 成功後將 web3 實例保存到狀態
        setWeb3(web3Instance);
        setMessage('錢包已連接！');
      } catch (error) {
        // 捕獲錯誤（例如用戶拒絕授權）
        console.error('錢包連接失敗', error);
        if (error.code === 4001) {
          setMessage('用戶已拒絕授權連接錢包。');
        } else {
          setMessage('錢包連接失敗，請重試！');
        }
      }
    } else {
      // 如果沒有安裝 MetaMask
      setMessage('請先安裝 MetaMask 錢包！');
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!web3) {
      setMessage('請先連接錢包！');
      return;
    }
    

    try {
      const accounts = await web3.eth.getAccounts();
      const signature = await web3.eth.personal.sign(
        `請求生成證書: ${JSON.stringify(formData)}`,
        accounts[0]
      );

      // 新增 console.log，輸出表單資訊、簽名和地址
      console.log('表單資料:', formData);
      console.log('數位簽名:', signature);
      console.log('用戶地址:', accounts[0]);
          
      
      const response = await axios.post('http://localhost:3000/generate-certificate', {
        ...formData,
        signature,
        address: accounts[0],
      });

      if (response.data.ipfsLink) {
        setMessage(`證書生成成功！下載連結: ${response.data.ipfsLink}`);
      } else {
        setMessage('生成證書成功，但無法取得下載連結。');
      }
      
    } catch (error) {
      console.error('生成證書失敗', error);
      setMessage('生成證書失敗，請重試！');
    }
    
  };*/

  return (
    <div style={{ padding: '20px' }}>
      <h1>MetaMask Authentication</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Address: {address || 'Not connected'}</p>
      <button onClick={signMessage} disabled={!address}>
        Sign Message
      </button>
      <p>Signature: {signature || 'No signature'}</p>
      <button onClick={submitData} disabled={!signature}>
        Submit
      </button>
    </div>
  );
};

export default ProducerHomepage;
