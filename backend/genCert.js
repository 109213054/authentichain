//舊版本
const fs = require('fs');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const IPFS = require('ipfs-http-client');
const Web3 = require('web3');
const mongoose = require('mongoose');

// Initialize IPFS client
const ipfs = IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Initialize Web3
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
const contractABI = [/* ABI of your smart contract */];
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contract = new web3.eth.Contract(contractABI, contractAddress);

// MongoDB schema and model
mongoose.connect('mongodb://localhost:27017/certificates', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const CertificateSchema = new mongoose.Schema({
    storeName: String,
    productSerial: String,
    ipfsCid: String,
    blockchainTxHash: String,
    createdAt: { type: Date, default: Date.now },
});

const Certificate = mongoose.model('Certificate', CertificateSchema);

// Helper function to sign data
function signData(privateKey, data) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
}

// Main function to handle certificate generation
async function handleCertificate(req, res) {
    try {
        const { storeName, productSerial, certificateData, userPrivateKey } = req.body;

        // Step 1: Sign the certificate data
        const signedData = signData(userPrivateKey, certificateData);

        // Step 2: Upload certificate to IPFS
        const ipfsResult = await ipfs.add(JSON.stringify({
            storeName,
            productSerial,
            certificateData,
            signature: signedData,
        }));
        const ipfsCid = ipfsResult.cid.toString();

        // Step 3: Write to blockchain
        const accounts = await web3.eth.getAccounts();
        const receipt = await contract.methods
            .storeCertificate(ipfsCid, storeName, productSerial)
            .send({ from: accounts[0], gas: 3000000 });
        const blockchainTxHash = receipt.transactionHash;

        // Step 4: Save to MongoDB
        const newCertificate = new Certificate({
            storeName,
            productSerial,
            ipfsCid,
            blockchainTxHash,
        });
        await newCertificate.save();

        // Step 5: Notify store owner
        const downloadLink = `https://ipfs.io/ipfs/${ipfsCid}`;
        res.json({
            success: true,
            message: 'Certificate generated successfully',
            downloadLink,
            blockchainTxHash,
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ success: false, message: 'Error generating certificate' });
    }
}

module.exports = { handleCertificate };
