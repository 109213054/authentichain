require("dotenv").config();
const { ethers } = require("ethers");

// Set up provider & wallet
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x4E4A26DBf22319D3Ec3770Fe5936B7B6c430eEA6";

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Replace with your contract ABI
const ABI = [
    {
        "inputs": [{ "internalType": "string", "name": "currency", "type": "string" }],
        "name": "getMaticPrice",
        "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Function to test the contract
async function main() {
    while(true){
        try {
        console.log("Fetching MATIC/USD price...");
        const price_USD = await contract.getMaticPrice("USD");
        console.log(`MATIC/USD Price: ${ethers.formatUnits(price_USD, 8)} USD`);
        console.log("Fetching MATIC/GBP price...");
        const price_GBP = await contract.getMaticPrice("GBP");
        console.log(`MATIC/GBP Price: ${ethers.formatUnits(price_GBP, 8)} GBP`);
    

        console.log("Fetching MATIC/JPY price...");
        const price_JPY = await contract.getMaticPrice("JPY");
        console.log(`MATIC/JPY Price: ${ethers.formatUnits(price_JPY, 8)} JPY`);
        console.log("Fetching MATIC/CNY price...");
        const price = await contract.getMaticPrice("CNY");
        console.log(`MATIC/CNY Price: ${ethers.formatUnits(price, 8)} CNY`);

        
    } catch (error) {
        console.error("Error calling contract:", error);
    }
    await sleep(10000);
}}
        

// Run the function
main();