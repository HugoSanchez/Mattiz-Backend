require('dotenv').config();
const ethers = require('ethers');

const instantiateWallet = () => {
    const privateKey = process.env.ETH_KEY
    return new ethers.Wallet(privateKey);
}

module.exports = instantiateWallet;