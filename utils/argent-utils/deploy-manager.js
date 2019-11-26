require('dotenv').config();
const etherlime = require('etherlime-lib');
const ethers = require('ethers');

const ganacheConfig = require('./config/ganacheConfig.json')
const ropstenConfig = require('./config/ropsten.json')

const defaultConfigs = { gasPrice: 20000000000, gasLimit: 6000000 }

const deployManager = (network) => {

    if (network === 'ganache') {
        let deployer = new etherlime.EtherlimeGanacheDeployer();
        let config = ganacheConfig;
        let privateKey = process.env.GANACHE_ETH_KEY
        let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        let wallet = new ethers.Wallet(privateKey, provider)
        return { deployer, config, network, wallet }
    }

    else if (network === 'ropsten') {
        let secret = process.env.ROPSTEN_ETH_KEY
        let infuraApiKey = process.env.INFURA_API_KEY
        let config = ropstenConfig
        let provider = new ethers.providers.JsonRpcProvider('https://ropsten.infura.io/v3/6d1b6ce3dd164756a15a69a39a05120e');
        let wallet = new ethers.Wallet(process.env.ROPSTEN_ETH_KEY, provider)
        let deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, null, defaultConfigs)
        return { deployer, config, network, wallet }
    }
}

module.exports = deployManager;