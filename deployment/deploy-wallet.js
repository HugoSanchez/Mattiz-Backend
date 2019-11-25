const WalletFactory = require('../build/WalletFactory');
const deployManager = require('../utils/argent-utils/deploy-manager');

const deployWallet = async (network) => {
    // Initiate Deployment Manager.
    let DeployManager = deployManager(network);
    // Deconstruct config.
    let config = DeployManager.config;
    // Deconstruct deployer wallet.
    let wallet = DeployManager.wallet;
    // Randome name.
    let walletName = ''
    console.log('Name: ', walletName)
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
    console.log('1')
    // Create Wallet tx.
    walletFactoryWrapper.createWallet(
        wallet.address, modules, walletName,
        {gasLimit: 1000000})
        .then(async tx => {
             // Wait for tx to be mined.
            await tx.wait()
            const txReceipt = await walletFactoryWrapper.verboseWaitForTransaction(tx);
            console.log('3')
            // Fish New Wallet Address
            const walletAddress = txReceipt.events.find(log => log.event === "WalletCreated").args["_wallet"];
            console.log('New wallet has been created at address: ', walletAddress)
        })
        .catch(err => console.log('Error: ', err))
    console.log('2')
   
}

module.exports = deployWallet;