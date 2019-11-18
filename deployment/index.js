const ethers = require('ethers');
const etherlime = require('etherlime-lib');

const Wallet = require("../build/BaseWallet");
const Registry = require("../build/ModuleRegistry");
const TransferStorage = require("../build/TransferStorage");
const GuardianStorage = require("../build/GuardianStorage");
const TransferModule = require("../build/TransferManager");
const OldTransferModule = require("../build/TokenTransfer");
const KyberNetwork = require("../build/KyberNetworkTest");
const TokenPriceProvider = require("../build/TokenPriceProvider");
const ERC20 = require("../build/TestERC20");
const TestContract = require('../build/TestContract');

const Module = require("../build/BaseModule");
const ENS = require('../build/TestENSRegistry');
const ENSManager = require('../build/ArgentENSManager');
const ENSResolver = require('../build/ArgentENSResolver');
const ENSReverseRegistrar = require('../build/TestReverseRegistrar');
const Factory = require('../build/WalletFactory');

const ETH_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ETH_LIMIT = 1000000000000000; 
const SECURITY_PERIOD = 2;
const SECURITY_WINDOW = 2;
const DECIMALS = 12; // number of decimal for TOKN contract
const KYBER_RATE = ethers.utils.bigNumberify(51 * 10 ** 13); // 1 TOKN = 0.00051 ETH
const ZERO_BYTES32 = ethers.constants.HashZero;

const ACTION_TRANSFER = 0;

// const DeployManager = require('../utils/argent-utils/deploy-manager.js');
const DeployManager = new etherlime.EtherlimeGanacheDeployer()

// Provider.
const url = "http://localhost:8545";
const privateKey = '0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f';
const provider = new ethers.providers.JsonRpcProvider(url);
const sysWallet = new ethers.Wallet(privateKey, provider);

// Address.
const toAddress = '0xda8a06f1c910cab18ad187be1faa2b8606c2ec86'

// ENS. 
let root = "one";
let subnameWallet = "bradbvry";
let walletNode = ethers.utils.namehash(subnameWallet + '.' + root);

const initiateFacotry = async (network, secret) => {

    /**
     * Instantiate a new depoyment manager. 
     * @param: network: 'string', name of the network to pass.
     * @param: secret: 'string', I'm guessing it's an optional private key.
     */
    // const manager = new DeployManager(network)
    // await manager.setup()
    // const deployer = manager.deployer;

    /**
     * Deploy ENS. 
     */
    let ensRegistry = await DeployManager.deploy(ENS);
    let ensResolver = await DeployManager.deploy(ENSResolver);
    let ensReverse = await DeployManager.deploy(ENSReverseRegistrar, {}, ensRegistry.contractAddress, ensResolver.contractAddress);
    let ensManager = await DeployManager.deploy(ENSManager, {}, subnameWallet + '.' + root, walletNode, ensRegistry.contractAddress, ensResolver.contractAddress);
    await ensResolver.addManager(ensManager.contractAddress);
    await ensResolver.addManager(sysWallet.address);
    await ensManager.addManager(sysWallet.address);
    console.log('Success 1')

    implementation = await DeployManager.deploy(Wallet);
    console.log('Success 2')

    moduleRegistry = await DeployManager.deploy(Registry);
    console.log('Success 3')

    factory = await DeployManager.deploy(Factory, {},
        ensRegistry.contractAddress,
        moduleRegistry.contractAddress,
        implementation.contractAddress,
        ensManager.contractAddress,
        ensResolver.contractAddress);
    await factory.addManager(sysWallet.address);
    await ensManager.addManager(factory.contractAddress);
    console.log('Success FINAL')
}


const deploy = async (network, secret) => {

    /**
     * Instantiate a new depoyment manager. 
     * @param: network: 'string', name of the network to pass.
     * @param: secret: 'string', I'm guessing it's an optional private key.
     */
    // const manager = new DeployManager(network)
    // await manager.setup()

    /**
     * Exemples of elements the new instance gives us access to. 
     */
    // const configurator = manager.configurator;
    // const config = configurator.config;
    // const deployer = manager.deployer;
    // const deploymentAccount = await deployer.signer.getAddress();

    /**
     * @Registry Smart contract that allows to register the modules 
     * that a wallet has access to. It stores the modules address 
     * and the name given to it. Registry is global.
     */
    let registry = await DeployManager.deploy(Registry);
    console.log('\n\n Registry: ', registry.contractAddress)

    /**
     * @KyberNetworl Own instance of Kyber network smart contract. 
     * Only needed for ganache. 
     */
    let kyber = await DeployManager.deploy(KyberNetwork);
    console.log('\n\n Kyber: ', kyber.contractAddress)
    
    /**
     * @TokenPriceProvider Module. Smart contract that allows the wallet to enforce 
     * the ETH spending limit that has been set for any given ERC20. 
     * ie: Gets the exchange rate of ETH <> ERC20 to make sure it doesn't 
     * surpass whatever limit has been set in ETH. 
     */
    let priceProvider = await DeployManager.deploy(TokenPriceProvider, {}, kyber.contractAddress);
    console.log('\n\n priceProvider: ', priceProvider.contractAddress)

    /**
     * @TransferStorage smart contract allows the wallet to set & get the state
     * of its transfers. It maps an address to a mapping that only authorized 
     * modules can modify.
     */
    let transferStorage = await DeployManager.deploy(TransferStorage);
    console.log('\n\n transferStorage: ', transferStorage.contractAddress)

    /**
     * @GuardianStorage smart contract that keeps track of a wallet's guardians. 
     * For every wallet, it stores their guardians info. Porvides setter and getter
     * methods to interact with it.
     */
    let guardianStorage = await DeployManager.deploy(GuardianStorage);
    console.log('\n\n guardianStorage: ', guardianStorage.contractAddress)

    /**
     * @TransferManager is a module that takes care of transfering ETH, ERC20 
     * or contract calls, bassed on security parameters such as daily limits 
     * and whitelists.
     */
    let previousTransferModule = await DeployManager.deploy(OldTransferModule, {},
        registry.contractAddress,
        transferStorage.contractAddress,
        guardianStorage.contractAddress,
        priceProvider.contractAddress,
        SECURITY_PERIOD,
        SECURITY_WINDOW,
        ETH_LIMIT
    );
    let transferModule = await DeployManager.deploy(TransferModule, {},
        registry.contractAddress,
        transferStorage.contractAddress,
        guardianStorage.contractAddress,
        priceProvider.contractAddress,
        SECURITY_PERIOD,
        SECURITY_WINDOW,
        ETH_LIMIT,
        previousTransferModule.contractAddress
    );

    let registerModuleTx = await registry.registerModule(
        transferModule.contractAddress, 
        ethers.utils.formatBytes32String("TransferModule")
    );
    await registerModuleTx.wait()
    
    /**
     * @BaseWallet smart contract keeps track of who owns the wallet 
     * and which modules have been authorized. 
     */
    let wallet = await DeployManager.deploy(Wallet);
    await wallet.init(sysWallet.address, [transferModule.contractAddress]);
    console.log('\n\n Wallet: ', wallet.contractAddress)

    /**
     * We deploy an ERC20 token and add it to Kyber.
     */
    let erc20 = await DeployManager.deploy(ERC20, {}, [sysWallet.address, wallet.contractAddress], 10000000, DECIMALS); // TOKN contract with 10M tokens (5M TOKN for wallet and 5M TOKN for account[0])
    await kyber.addToken(erc20.contractAddress, KYBER_RATE, DECIMALS);
    await priceProvider.syncPrice(erc20.contractAddress);

    // Send funds to the wallet.
    await sysWallet.sendTransaction({ to: wallet.contractAddress, value: ethers.utils.bigNumberify('1000000000000000000') });
    let walletBalance = await DeployManager.provider.getBalance(wallet.contractAddress)
    console.log('\n\n Wallet Balance: ', ethers.utils.formatEther(walletBalance) + ' ETH')

    
    ////////////////////////////////////////////////
    //// Transfer Module functions.
    ////////////////////////////////////////////////

    console.log('Before time travel')
    console.log('After time travel, ')

    /**
     * @getCurrentLimit queries the wallet to get the current limit. 
     */
    let limit = await transferModule.getCurrentLimit(wallet.contractAddress);
    console.log('\n\n Wallet limit: ', limit.toString())


    /**
     * @changeLimit changes the spending limit for a given wallet 
     * after a safety period. 
     */
    await transferModule.from(sysWallet).changeLimit(wallet.contractAddress, 10000000000000); // 10000000000000
    await DeployManager.provider.send('evm_increaseTime', 10000000000000);
    await DeployManager.provider.send('evm_mine');
    let newLimit = await transferModule.getCurrentLimit(wallet.contractAddress);
    console.log('\n\n new Wallet limit: ', newLimit.toString())
    
    /**
     * @addToWhitelist adds an address to the wallet's whitelists
     * after a safety period. 
     */
    await transferModule.from(sysWallet).addToWhitelist(wallet.contractAddress, erc20.contractAddress);
    let isTrusted = await transferModule.isWhitelisted(wallet.contractAddress, erc20.contractAddress);
    
    /**
     * @getDailyUnspent returns how much of your daily spending limit remains.
     */
    let balanceBeforeTransfer = await DeployManager.provider.getBalance(toAddress)
    console.log('\n\n Balance BEFORE transfer: ', ethers.utils.formatEther(balanceBeforeTransfer))
    let unspentBefore = await transferModule.getDailyUnspent(wallet.contractAddress);
    console.log('\n\n Daily Unspent BEFORE transfer: ', unspentBefore.toString()) 
    
    /**
     * @transferToken function to execute a transfer.
     */
    const params = [wallet.contractAddress, ETH_TOKEN, toAddress, 1000000, ZERO_BYTES32];
    const tx = await transferModule.from(sysWallet).transferToken(...params);
    await tx.wait()
    txReceipt = await transferModule.verboseWaitForTransaction(tx);

    // Check that math is correct - funds have been transfered and sums match.
    let newWalletBalance = await DeployManager.provider.getBalance(wallet.contractAddress)
    console.log('\n\n NEW Wallet Balance: ', ethers.utils.formatEther(newWalletBalance) + ' ETH')
    let balanceAfterTransfer = await DeployManager.provider.getBalance(toAddress)
    console.log('\n\n Balance AFTER transfer: ', ethers.utils.formatEther(balanceAfterTransfer).toString())
    let unspentAfter = await transferModule.getDailyUnspent(wallet.contractAddress);
    console.log('\n\n Daily Unspent AFTER transfer: ', unspentAfter.toString()) 
    console.log('\n\n Difference: ', parseFloat(unspentBefore.toString()) - parseFloat(unspentAfter.toString()))

    /**
     * @callContract function to execute third party contract calls.
     */
    let contract = await DeployManager.deploy(TestContract);
    let state = await contract.state()
    console.log('\n\n Initial state: ', state.toString())
    let dataToTransfer = contract.contract.interface.functions['setState'].encode(['100']);
    let contractCallParams = [wallet.contractAddress, contract.contractAddress, 0, dataToTransfer];
    let contractCallTx = await transferModule.from(sysWallet).callContract(...contractCallParams);
    let contractCallTxReceipt = await transferModule.verboseWaitForTransaction(contractCallTx);
    let newState = await contract.state()
    console.log('\n\n New state AFTER transaction: ', newState.toString())



    console.log('\n\n Success')
}

deploy('ganache')
// initiateFacotry('ganache')