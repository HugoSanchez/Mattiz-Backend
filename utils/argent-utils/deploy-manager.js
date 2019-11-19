require('dotenv').config();
const etherlime = require('etherlime-lib');

const defaultConfigs = {
    gasPrice: 20000000000, // 20 Gwei
    gasLimit: 6000000 
}

const deployManager = (network, secret, infuraApiKey) => {

    if (network === 'ganache') {return new etherlime.EtherlimeGanacheDeployer()}

    else {return new etherlime.InfuraPrivateKeyDeployer(secret, network, infuraApiKey, defaultConfigs)}
}

module.exports = deployManager;