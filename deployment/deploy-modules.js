const ethers = require('ethers');
const updateConfigFile = require('../utils/argent-utils/update-config');

const ModuleRegistry = require("../build/ModuleRegistry");

const GuardianStorage = require('../build/GuardianStorage');
const TransferStorage = require('../build/TransferStorage');
const DappStorage = require('../build/DappStorage');
const KyberNetwork = require("../build/KyberNetworkTest");
const TokenPriceProvider = require("../build/TokenPriceProvider");
const PreviousTokenTransfer = require("../build/TokenTransfer");
const GuardianManager = require('../build/GuardianManager');
const TokenExchanger = require('../build/TokenExchanger');
const LockManager = require('../build/LockManager');
const RecoveryManager = require('../build/RecoveryManager');
const TokenTransfer = require('../build/TransferManager');
const ApprovedTransfer = require('../build/ApprovedTransfer');
const DappRegistry = require('../build/DappRegistry');
const DappManager = require('../build/DappManager');

const deployManager = require('../utils/argent-utils/deploy-manager');

const deployModules = async (network) => {

    let DeployManager = deployManager(network);
    let config = DeployManager.config;

    ////////////////////////////////////
    // Deploy Storage
    ////////////////////////////////////
    
    // Deploy the Guardian Storage
    const GuardianStorageWrapper = await DeployManager.deployer.deploy(GuardianStorage);
    console.log('01 - Guardian Storage: ', GuardianStorageWrapper.contractAddress);
    // Deploy the Transfer Storage
    const TransferStorageWrapper = await DeployManager.deployer.deploy(TransferStorage);
    console.log('02 - Transfer Storage: ', TransferStorageWrapper.contractAddress);
    // Deploy the Dapp Storage
    const DappStorageWrapper = await DeployManager.deployer.deploy(DappStorage); 
    console.log('03 - Dapp Storage: ', DappStorageWrapper.contractAddress);
    
    ////////////////////////////////////
    // Deploy Modules
    ////////////////////////////////////

    // Deploy Module Registry.
    const ModuleRegistryWrapper = await DeployManager.deployer.deploy(ModuleRegistry);
    console.log('04 - Module Registry: ', ModuleRegistryWrapper.contractAddress);
    // Deploy Kyber contract to mock on ganache.
    let KyberNetworkWrapper
    if (network === 'ganache') { 
        KyberNetworkWrapper = await DeployManager.deployer.deploy(KyberNetwork)};
    if (network === 'ropsten') { 
        KyberNetworkWrapper = DeployManager.deployer.wrapDeployedContract(KyberNetwork, config.Kyber.contract)};
    console.log('05 - Kyber Contract: ', KyberNetworkWrapper.contractAddress);
    // Deploy price provider.
    let TokenPriceProviderWrapper = await DeployManager.deployer.deploy(TokenPriceProvider, {}, KyberNetworkWrapper.contractAddress);
    console.log('06 - Token Price Provider: ', TokenPriceProviderWrapper.contractAddress);
    

    // Deploy the GuardianManager module
    const GuardianManagerWrapper = await DeployManager.deployer.deploy(
        GuardianManager,
        {},
        ModuleRegistryWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0);
    console.log('07 - GuardianManagerWrapper: ', GuardianManagerWrapper.contractAddress);
    // Deploy the LockManager module
    const LockManagerWrapper = await DeployManager.deployer.deploy(
        LockManager,
        {},
        ModuleRegistryWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.lockPeriod || 0);
    console.log('08 - LockManagerWrapper: ', LockManagerWrapper.contractAddress);
    // Deploy the RecoveryManager module
    const RecoveryManagerWrapper = await DeployManager.deployer.deploy(
        RecoveryManager,
        {},
        ModuleRegistryWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.recoveryPeriod || 0,
        config.settings.lockPeriod || 0);
    console.log('09 - RecoveryManagerWrapper: ', RecoveryManagerWrapper.contractAddress);
    // Deploy the ApprovedTransfer module
    const ApprovedTransferWrapper = await DeployManager.deployer.deploy(
        ApprovedTransfer,
        {},
        ModuleRegistryWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress);
    console.log('10 - ApprovedTransferWrapper: ', ApprovedTransferWrapper.contractAddress);
    // Deploy previous TokenTransfer module
    const PreviousTokenTransferWrapper = await DeployManager.deployer.deploy(
        PreviousTokenTransfer,
        {},
        ModuleRegistryWrapper.contractAddress,
        TransferStorageWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        TokenPriceProviderWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0,
        config.settings.defaultLimit || '1000000000000000000');
    console.log('11 - PreviousTokenTransferWrapper: ', PreviousTokenTransferWrapper.contractAddress);
    // Deploy the TokenTransfer module
    const TokenTransferWrapper = await DeployManager.deployer.deploy(
        TokenTransfer,
        {},
        ModuleRegistryWrapper.contractAddress,
        TransferStorageWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        TokenPriceProviderWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0,
        config.settings.defaultLimit || '1000000000000000000',
        PreviousTokenTransferWrapper.contractAddress);
    console.log('12 - TokenTransferWrapper: ', TokenTransferWrapper.contractAddress);
    // Deploy Dapp Registry
    const DappRegistryWrapper = await DeployManager.deployer.deploy(DappRegistry)
    console.log('13 - DappRegistryWrapper: ', DappRegistryWrapper.contractAddress);
    // Deploy the DappManager module
    const DappManagerWrapper = await DeployManager.deployer.deploy(
        DappManager,
        {},
        ModuleRegistryWrapper.contractAddress,
        DappRegistryWrapper.contractAddress,
        DappStorageWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0,
        config.settings.defaultLimit || '1000000000000000000');
    console.log('14 - DappManagerWrapper: ', DappManagerWrapper.contractAddress);
    // Deploy the TokenExchanger module
    const TokenExchangerWrapper = await DeployManager.deployer.deploy(
        TokenExchanger,
        {},
        ModuleRegistryWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        KyberNetworkWrapper.contractAddress,
        config.contracts.MultiSigWallet,
        config.settings.feeRatio || 0);
    console.log('15 - TokenExchangerWrapper: ', TokenExchangerWrapper.contractAddress);

    ////////////////////////////////////
    // Register Modules
    ////////////////////////////////////

    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        GuardianManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("GuardianManagerWrapper")
    );
    await registerModuleTx.wait()
    console.log('1')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        LockManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("LockManager")
    );
    await registerModuleTx.wait()
    console.log('2')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        RecoveryManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("RecoveryManager")
    );
    await registerModuleTx.wait()
    console.log('3')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        ApprovedTransferWrapper.contractAddress, 
        ethers.utils.formatBytes32String("ApprovedTransfer")
    );
    await registerModuleTx.wait()
    console.log('4')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        TokenTransferWrapper.contractAddress, 
        ethers.utils.formatBytes32String("TokenTransfer")
    );
    await registerModuleTx.wait()
    console.log('5')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        DappManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("DappManager")
    );
    await registerModuleTx.wait()
    console.log('6')
    var registerModuleTx = await ModuleRegistryWrapper.registerModule(
        TokenExchangerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("TokenExchanger")
    );
    await registerModuleTx.wait()
    console.log('7')

    ///////////////////////////////////
    // Update config
    ////////////////////////////////////

    config.modules.GuardianStorage = GuardianStorageWrapper.contractAddress
    config.modules.TransferStorage = TransferStorageWrapper.contractAddress
    config.modules.DappStorage = DappStorageWrapper.contractAddress
    config.modules.GuardianManager = GuardianManagerWrapper.contractAddress
    config.modules.LockManager = LockManagerWrapper.contractAddress
    config.modules.RecoveryManager = RecoveryManagerWrapper.contractAddress
    config.modules.ApprovedTransfer = ApprovedTransferWrapper.contractAddress
    config.modules.TokenTransfer = TokenTransferWrapper.contractAddress
    config.modules.DappManager = DappManagerWrapper.contractAddress
    config.modules.TokenExchanger = TokenExchangerWrapper.contractAddress
    config.modules.TokenPriceProvider = TokenPriceProviderWrapper.contractAddress
    config.modules.PreviousTokenTransfer = PreviousTokenTransferWrapper.contractAddress
    config.contracts.DappRegistry = DappRegistryWrapper.contractAddress
    config.contracts.ModuleRegistry = ModuleRegistryWrapper.contractAddress
    

    // Save changes.
    updateConfigFile(network, config)
    console.log('DONE.')
};

module.exports = deployModules;