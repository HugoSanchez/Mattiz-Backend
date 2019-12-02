const WalletFactory = require('../build/WalletFactory');
const deployManager = require('../utils/argent/deploy-manager');

const deployWallet = async (network, ownerAddress) => {
    // Initiate Deployment Manager.
    let DeployManager = deployManager(network);
    // Deconstruct config.
    let config = DeployManager.config;
    // Randome name.
    let walletName = ''
    // Array of module addresses.
    let modules = [
        config.modules.GuardianManager,
        config.modules.LockManager,
        config.modules.RecoveryManager,
        config.modules.ApprovedTransfer,
        config.modules.TokenTransfer,
        config.modules.DappManager,
        config.modules.TokenExchanger
    ];
    // Wrap Factory contract.
    const walletFactoryWrapper = await DeployManager.deployer.wrapDeployedContract(
        WalletFactory, 
        config.contracts.WalletFactory);
    // Create Wallet tx.
    let tx = await walletFactoryWrapper.createWallet(
        ownerAddress, modules, walletName, {gasLimit: 1000000})
    // Wait for tx to be mined.
    const txReceipt = await walletFactoryWrapper.verboseWaitForTransaction(tx);
    // Fish New Wallet Address
    const walletAddress = txReceipt.events.find(log => log.event === "WalletCreated").args["_wallet"];
    console.log('New wallet has been created at address: ', walletAddress)
    return walletAddress
}

module.exports = deployWallet;