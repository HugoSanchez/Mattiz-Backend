/** Only for Ganache */

require('dotenv').config();
const fs = require('fs');
const ethers = require('ethers');

const ENS = require('../build/TestENSRegistry');
const ENSManager = require('../build/ArgentENSManager');
const ENSResolver = require('../build/ArgentENSResolver');
const ENSReverseRegistrar = require('../build/TestReverseRegistrar');
const config = require('../utils/argent-utils/config/ganacheConfig.json');
const instantiateWallet = require('../utils/argent-utils/system-wallet');

const ZERO_BYTES32 = ethers.constants.HashZero;

const sysWallet = instantiateWallet()

let root = "one";
let subnameWallet = "bradbvry";
let walletNode = ethers.utils.namehash(subnameWallet + '.' + root);

const deployENS = async DeployManager => {
    // Deploy ENS contracts to mock functionality
    console.log('Deploying ENS contracts...');
    let ensRegistry = await DeployManager.deploy(ENS);
    let ensResolver = await DeployManager.deploy(ENSResolver);
    let ensReverse = await DeployManager.deploy(ENSReverseRegistrar, {}, ensRegistry.contractAddress, ensResolver.contractAddress);
    let ensManager = await DeployManager.deploy(ENSManager, {}, subnameWallet + '.' + root, walletNode, ensRegistry.contractAddress, ensResolver.contractAddress);
    await ensResolver.addManager(ensManager.contractAddress);
    await ensResolver.addManager(sysWallet.address);
    await ensManager.addManager(sysWallet.address);

    await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(root)), sysWallet.address);
    await ensRegistry.from(sysWallet).setSubnodeOwner(ethers.utils.namehash(root), ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subnameWallet)), ensManager.contractAddress);
    await ensRegistry.setSubnodeOwner(ZERO_BYTES32, ethers.utils.keccak256(ethers.utils.toUtf8Bytes('reverse')), sysWallet.address);
    await ensRegistry.from(sysWallet).setSubnodeOwner(ethers.utils.namehash('reverse'), ethers.utils.keccak256(ethers.utils.toUtf8Bytes('addr')), ensReverse.contractAddress);

    // Update config file.
    config.contracts.ENSManager = ensManager.contractAddress;
    config.contracts.ENSResolver = ensResolver.contractAddress;
    config.contracts.ENSRegistry = ensRegistry.contractAddress;
    let data = JSON.stringify(config)
    fs.writeFileSync('./utils/argent-utils/config/ganacheConfig.json', data)
}

module.exports = deployENS;