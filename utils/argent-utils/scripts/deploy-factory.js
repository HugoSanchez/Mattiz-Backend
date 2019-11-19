require('dotenv').config();
const ethers = require('ethers');

const Wallet = require("../../../build/BaseWallet");
const ModuleRegistry = require("../../../build/ModuleRegistry");

const ENS = require('../../../build/TestENSRegistry');
const ENSManager = require('../../../build/ArgentENSManager');
const ENSResolver = require('../../../build/ArgentENSResolver');
const ENSReverseRegistrar = require('../../../build/TestReverseRegistrar');
const WalletFactory = require('../../../build/WalletFactory');

const deployManager = require('../deploy-manager');

const url = "http://localhost:8545";
const privateKey = '0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f';
const provider = new ethers.providers.JsonRpcProvider(url);
const sysWallet = new ethers.Wallet(privateKey, provider);

let root = "one";
let subnameWallet = "bradbvry";
let walletNode = ethers.utils.namehash(subnameWallet + '.' + root);

const deployFactory = async (network) => {

    if (network === 'ganache') {
        let DeployManager = deployManager('ganache');

        // Deploy ENS contracts to mock functionality
        console.log('Deploying ENS contracts...');
        let ensRegistry = await DeployManager.deploy(ENS);
        let ensResolver = await DeployManager.deploy(ENSResolver);
        let ensReverse = await DeployManager.deploy(ENSReverseRegistrar, {}, ensRegistry.contractAddress, ensResolver.contractAddress);
        let ensManager = await DeployManager.deploy(ENSManager, {}, subnameWallet + '.' + root, walletNode, ensRegistry.contractAddress, ensResolver.contractAddress);
        await ensResolver.addManager(ensManager.contractAddress);
        await ensResolver.addManager(sysWallet.address);
        await ensManager.addManager(sysWallet.address);
        console.log('Success.')

        // Deploy Base Wallet
        console.log('Deploying Base Wallet contracts...');
        implementation = await DeployManager.deploy(Wallet);
        console.log('Success.')

        // Deploy Module Registry.
        console.log('Deploying Module Registry...');
        moduleRegistry = await DeployManager.deploy(ModuleRegistry);
        console.log('Success.');

        // Deploy Factory.
        console.log('Deploying Factory...');
        factory = await DeployManager.deploy(WalletFactory, {},
            ensRegistry.contractAddress,
            moduleRegistry.contractAddress,
            implementation.contractAddress,
            ensManager.contractAddress,
            ensResolver.contractAddress);
        await factory.addManager(sysWallet.address);
        await ensManager.addManager(factory.contractAddress);
        console.log('Success FINAL')

        console.log('\n\n')
        console.log('\n\n Facotry Contract Address: ', factory.contractAddress)
        console.log('\n\n')
    }

}

module.exports = deployFactory;