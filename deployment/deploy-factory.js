require('dotenv').config();
const fs = require('fs');

const Wallet = require("../build/BaseWallet");
const WalletFactory = require('../build/WalletFactory');
const ENSManager = require('../build/ArgentENSManager');

const deployENS = require('./deploy-ens');
const deployManager = require('../utils/argent-utils/deploy-manager');

const config = require('../utils/argent-utils/config/ganacheConfig.json')
const instantiateWallet = require('../utils/argent-utils/system-wallet');
const sysWallet = instantiateWallet()

const deployFactory = async (network) => {
    // Instantiate deployer.
    let DeployManager = deployManager(network);        
    // Deploy ENS contracts.
    await deployENS(DeployManager)
    // Deploy base wallet.
    let baseWallet = await DeployManager.deploy(Wallet);
    // Deploy factory.
    console.log('Deploying factory...')
    let factory = await DeployManager.deploy(WalletFactory, {},
        config.contracts.ENSRegistry,
        config.contracts.ModuleRegistry,
        baseWallet.contractAddress,
        config.contracts.ENSManager,
        config.contracts.ENSResolver);
    // Add factory manager.
    console.log('1')
    await factory.addManager(sysWallet.address);
    // Add Factory as ENS Manager.
    console.log('2')
    let ensManager = DeployManager.wrapDeployedContract(ENSManager, config.contracts.ENSManager)
    console.log('3')
    await ensManager.addManager(factory.contractAddress)
    console.log('4')
    // Update addresses.
    config.contracts.WalletFactory = factory.contractAddress;
    // Save changes.
    let data = JSON.stringify(config)
    fs.writeFileSync('./utils/argent-utils/config/ganacheConfig.json', data)
    console.log('Successfully deployed factory')
}

module.exports = deployFactory;