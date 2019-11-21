const Wallet = require("../build/BaseWallet");
const WalletFactory = require('../build/WalletFactory');
const ENSManager = require('../build/ArgentENSManager');

const deployManager = require('../utils/argent-utils/deploy-manager');
const updateConfigFile = require('../utils/argent-utils/update-config');

const deployFactory = async (network) => {
    // Instantiate deployer.
    let DeployManager = deployManager(network);
    // Deconstruct config.
    let config = DeployManager.config;
    // Deconstruct wallet.
    let systemWallet = DeployManager.wallet;      
    // Deploy base wallet.
    let baseWallet = await DeployManager.deployer.deploy(Wallet);
    // Deploy factory.
    let factory = await DeployManager.deployer.deploy(WalletFactory, {},
        config.contracts.ENSRegistry,
        config.contracts.ModuleRegistry,
        baseWallet.contractAddress,
        config.contracts.ENSManager,
        config.contracts.ENSResolver);
    // Add factory manager.
    await factory.addManager(systemWallet.address);
    // Add Factory as ENS Manager.
    let ensManager = DeployManager.deployer.wrapDeployedContract(ENSManager, config.contracts.ENSManager)
    await ensManager.addManager(factory.contractAddress)
    // Update addresses.
    config.contracts.WalletFactory = factory.contractAddress;
    // Save changes.
    updateConfigFile(network, config)
    console.log('Successfully deployed factory!')
}

module.exports = deployFactory;