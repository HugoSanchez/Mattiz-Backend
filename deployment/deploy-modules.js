require('dotenv').config();
const fs = require('fs');
const ethers = require('ethers')

const ModuleRegistry = require("../build/ModuleRegistry");

const GuardianStorage = require('../build/GuardianStorage');
const TransferStorage = require('../build/TransferStorage');
const DappStorage = require('../build/DappStorage');

const GuardianManager = require('../build/GuardianManager');
const TokenExchanger = require('../build/TokenExchanger');
const LockManager = require('../build/LockManager');
const RecoveryManager = require('../build/RecoveryManager');
const TokenTransfer = require('../build/TokenTransfer');
const ApprovedTransfer = require('../build/ApprovedTransfer');
const DappManager = require('../build/DappManager');

const deployManager = require('../utils/argent-utils/deploy-manager');
const config = require('../utils/argent-utils/config/ganacheConfig.json')

const deployModules = async (network, secret) => {

    let DeployManager = deployManager(network);

    ////////////////////////////////////
    // Deploy Storage
    ////////////////////////////////////
    console.log('Deploying storage...')
    // Deploy the Guardian Storage
    const GuardianStorageWrapper = await DeployManager.deploy(GuardianStorage);
    // Deploy the Transfer Storage
    const TransferStorageWrapper = await DeployManager.deploy(TransferStorage);
    // Deploy the Dapp Storage
    const DappStorageWrapper = await DeployManager.deploy(DappStorage); 

    ////////////////////////////////////
    // Deploy Modules
    ////////////////////////////////////
    console.log('Deploying Modules...')
    // Deploy Module Registry.
    const moduleRegistry = await DeployManager.deploy(ModuleRegistry);

    // Deploy the GuardianManager module
    const GuardianManagerWrapper = await DeployManager.deploy(
        GuardianManager,
        {},
        moduleRegistry.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0);
    // Deploy the LockManager module
    const LockManagerWrapper = await DeployManager.deploy(
        LockManager,
        {},
        moduleRegistry.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.lockPeriod || 0);
    // Deploy the RecoveryManager module
    const RecoveryManagerWrapper = await DeployManager.deploy(
        RecoveryManager,
        {},
        moduleRegistry.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.recoveryPeriod || 0,
        config.settings.lockPeriod || 0);
    // Deploy the ApprovedTransfer module
    const ApprovedTransferWrapper = await DeployManager.deploy(
        ApprovedTransfer,
        {},
        moduleRegistry.contractAddress,
        GuardianStorageWrapper.contractAddress);
    // Deploy the TokenTransfer module
    const TokenTransferWrapper = await DeployManager.deploy(
        TokenTransfer,
        {},
        moduleRegistry.contractAddress,
        TransferStorageWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.contracts.TokenPriceProvider,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0,
        config.settings.defaultLimit || '1000000000000000000');
    // Deploy the DappManager module
    const DappManagerWrapper = await DeployManager.deploy(
        DappManager,
        {},
        moduleRegistry.contractAddress,
        config.contracts.DappRegistry,
        DappStorageWrapper.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.settings.securityPeriod || 0,
        config.settings.securityWindow || 0,
        config.settings.defaultLimit || '1000000000000000000');
    // Deploy the TokenExchanger module
    const TokenExchangerWrapper = await DeployManager.deploy(
        TokenExchanger,
        {},
        moduleRegistry.contractAddress,
        GuardianStorageWrapper.contractAddress,
        config.Kyber.contract,
        config.contracts.MultiSigWallet,
        config.settings.feeRatio || 0);
    
    ////////////////////////////////////
    // Register Modules
    ////////////////////////////////////
    console.log('Registering Modules...')
    var registerModuleTx = await moduleRegistry.registerModule(
        GuardianManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("GuardianManagerWrapper")
    );
    await registerModuleTx.wait()
    console.log('1')
    var registerModuleTx = await moduleRegistry.registerModule(
        LockManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("LockManager")
    );
    await registerModuleTx.wait()
    console.log('2')
    var registerModuleTx = await moduleRegistry.registerModule(
        RecoveryManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("RecoveryManager")
    );
    await registerModuleTx.wait()
    console.log('3')
    var registerModuleTx = await moduleRegistry.registerModule(
        ApprovedTransferWrapper.contractAddress, 
        ethers.utils.formatBytes32String("ApprovedTransfer")
    );
    await registerModuleTx.wait()
    console.log('4')
    var registerModuleTx = await moduleRegistry.registerModule(
        TokenTransferWrapper.contractAddress, 
        ethers.utils.formatBytes32String("TokenTransfer")
    );
    await registerModuleTx.wait()
    console.log('5')
    var registerModuleTx = await moduleRegistry.registerModule(
        DappManagerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("DappManager")
    );
    await registerModuleTx.wait()
    console.log('6')
    var registerModuleTx = await moduleRegistry.registerModule(
        TokenExchangerWrapper.contractAddress, 
        ethers.utils.formatBytes32String("TokenExchanger")
    );
    await registerModuleTx.wait()
    console.log('7')
    ///////////////////////////////////
    // Update config
    ////////////////////////////////////
    console.log('Updating module addresses...')
    // Update addresses.
    config.modules.GuardianStorage = GuardianManagerWrapper.contractAddress
    config.modules.TransferStorage = TransferStorageWrapper.contractAddress
    config.modules.DappStorage = DappStorageWrapper.contractAddress
    config.modules.GuardianManager = GuardianManagerWrapper.contractAddress
    config.modules.LockManager = LockManagerWrapper.contractAddress
    config.modules.RecoveryManager = RecoveryManagerWrapper.contractAddress
    config.modules.ApprovedTransfer = ApprovedTransferWrapper.contractAddress
    config.modules.TokenTransfer = TokenTransferWrapper.contractAddress
    config.modules.DappManager = DappManagerWrapper.contractAddress
    config.modules.TokenExchanger = TokenExchangerWrapper.contractAddress
    config.contracts.ModuleRegistry = moduleRegistry.contractAddress
    // Save changes.
    let updatedConfig = JSON.stringify(config)
    fs.writeFileSync('./utils/argent-utils/config/ganacheConfig.json', updatedConfig)
};

module.exports = deployModules;