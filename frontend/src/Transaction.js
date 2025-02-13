import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from "ethers";



const Transaction = () => {
    const [message, setMessage] = useState('');
    const [web3, setWeb3] = useState(null);
    const [address, setAddress] = useState('');
    
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


    // 提交表單，進行簽名並提交至後端
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!web3 || !address) {
            setMessage('請先連接錢包！');
        return;
        }

        //檢查餘額
        const balance = await web3.eth.getBalance(address);
        if (web3.utils.fromWei(balance, 'ether') < fee) {
        setMessage('MATIC 餘額不足，請充值後再試');
        return;
        }
        
        try {
            // 簽名的內容
            const payload = {
                storeAddress: address,
                timestamp: Math.floor(Date.now() / 1000),
        };

        // 使用用戶地址進行數位簽名
        const signature = await web3.eth.personal.sign(
        JSON.stringify(payload),
        address,
        ''
        );

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();


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

        const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, signer);
        const tx = await contract.pay({ value: ethers.utils.parseEther("0.001") });
        await tx.wait(); // 等待交易確認

        

        const transaction = await web3.eth.sendTransaction({
            from: address,
            to: contractAddress,
            value: web3.utils.toWei(fee.toString(), 'ether'), // MATIC 也是 18 位小數
        });
        
        

        // 🟢 這裡增加 `userAddress` 參數，傳遞到後端
        const response = await axios.post('http://localhost:5000/api/verify-payment', {
            //signature,
            transactionHash: transaction.transactionHash, // 🟢 交易哈希
            userAddress: address, // 🟢 新增使用者地址
        });
        

      if (response.data) {
        setMessage(`扣款成功！${response.data}`);
      } else {
        setMessage('扣款成功！');
      }
    } catch (error) {
      console.error('扣款失敗', error);
      setMessage('扣款失敗，錯誤: ${error.message}');
    }
  };

  return (
    <div>
        <button className="verify-btn" onClick={connectWallet}>連接錢包</button>
        <button className="search-btn" onClick={handleSubmit}>開始扣款</button>
    </div>
  );
};

export default Transaction;
