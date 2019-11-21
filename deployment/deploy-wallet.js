require('dotenv').config();

const WalletFactory = require('../build/WalletFactory');

const deployManager = require('../utils/argent-utils/deploy-manager');

const config = require('../utils/argent-utils/config/ganacheConfig.json')

const instantiateWallet = require('../utils/argent-utils/system-wallet');
const sysWallet = instantiateWallet()

const deployWallet = async network => {
    console.log('SysWallet: ', sysWallet.address)
    let DeployManager = deployManager(network);

    let modules = [
        config.modules.GuardianManager,
        config.modules.LockManager,
        config.modules.RecoveryManager,
        config.modules.ApprovedTransfer,
        config.modules.TokenTransfer,
        config.modules.DappManager,
        config.modules.TokenExchanger
    ];

    // Deploy Wallet script HERE.
    console.log('1')
    const walletFactoryWrapper = 
        await DeployManager.wrapDeployedContract(WalletFactory, config.contracts.WalletFactory);
    console.log('2')
    const tx = 
        await walletFactoryWrapper.from(sysWallet).createWallet(sysWallet.address, modules, 'john')
    console.log('3')
    const txReceipt = 
        await walletFactoryWrapper.verboseWaitForTransaction(tx);
    const walletAddress = txReceipt.events.find(log => log.event === "WalletCreated").args["_wallet"];
    console.log('Wallet Address: ', walletAddress)
}

module.exports = deployWallet;