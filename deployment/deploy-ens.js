const ethers = require('ethers');
const updateConfigFile = require('../utils/argent-utils/update-config');

const ENS = require('../build/TestENSRegistry');
const ENSManager = require('../build/ArgentENSManager');
const ENSResolver = require('../build/ArgentENSResolver');
const ENSReverseRegistrar = require('../build/TestReverseRegistrar');
const ZERO_BYTES32 = ethers.constants.HashZero;

let root = "eth";
let subnameWallet = "bradbvry";
let walletNode = ethers.utils.namehash(subnameWallet + '.' + root);

const deployENS = async DeployManager => {

    let contracts = DeployManager.config.contracts
    let wallet = DeployManager.wallet
    let ensRegistry

    if (DeployManager.network === 'ganache') { 
        ensRegistry = await DeployManager.deployer.deploy(ENS);
        console.log('01 - ENS Registry: ', ensRegistry.contractAddress); }
    else { 
        ensRegistry = await DeployManager.deployer.wrapDeployedContract(ENS, contracts.ENSRegistry);
        console.log('01 - ENS Registry: ', ensRegistry.contractAddress);
    }
        let ensResolver = await DeployManager.deployer.deploy(ENSResolver);
        console.log('02 - ENS Resolver: ', ensResolver.contractAddress);
        let ensReverse  = await DeployManager.deployer.deploy(ENSReverseRegistrar, {}, ensRegistry.contractAddress, ensResolver.contractAddress);
        console.log('03 - ENS Reverse: ', ensReverse.contractAddress);
        let ensManager  = await DeployManager.deployer.deploy(ENSManager, {}, subnameWallet + '.' + root, walletNode, ensRegistry.contractAddress, ensResolver.contractAddress);
        console.log('04 - ENS Manager: ', ensManager.contractAddress);
        await ensResolver.addManager(ensManager.contractAddress);
        console.log('05 - ENS Resolver added manager.')
        await ensResolver.addManager(ensManager.contractAddress);
        console.log('06 - ENS Resolver added manager.');
        await ensResolver.addManager(wallet.address);
        console.log('07 - ENS Resolver added manager.')
        await ensManager.addManager(wallet.address);
        console.log('08 - ENS Manager added manager.')
    
    if (DeployManager.network === 'ganache') { 
        await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(root)), wallet.address, {gasLimit: 1000000});
        await ensRegistry.from(wallet).setSubnodeOwner(ethers.utils.namehash(root), ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subnameWallet)), ensManager.contractAddress, {gasLimit: 1000000});
        await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes('reverse')), wallet.address, {gasLimit: 1000000});
        await ensRegistry.from(wallet).setSubnodeOwner(ethers.utils.namehash('reverse'), ethers.utils.keccak256(ethers.utils.toUtf8Bytes('addr')), ensReverse.contractAddress, {gasLimit: 1000000}); 
        console.log('09 - New Subnode owners.') }
    else { 
        await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subnameWallet + '.' + root)), wallet.address, {gasLimit: 1000000});
        await ensRegistry.setSubnodeOwner(ethers.utils.namehash(root), ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subnameWallet)), ensManager.contractAddress, {gasLimit: 1000000});
        await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes('reverse')), wallet.address, {gasLimit: 1000000});
        await ensRegistry.setSubnodeOwner(ethers.utils.namehash('reverse'), ethers.utils.keccak256(ethers.utils.toUtf8Bytes('addr')), ensReverse.contractAddress, {gasLimit: 1000000});
        console.log('09 - New Subnode owners.') }

    DeployManager.config.contracts.ENSManager = ensManager.contractAddress;
    DeployManager.config.contracts.ENSResolver = ensResolver.contractAddress;
    DeployManager.config.contracts.ENSRegistry = ensRegistry.contractAddress;
    DeployManager.config.contracts.ensReverse = ensRegistry.ensReverse;
    updateConfigFile(DeployManager.network, DeployManager.config)
    console.log('10 - Updated configuration files. DONE.')
}

module.exports =  deployENS;