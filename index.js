// Testing ground

require('dotenv').config();
const ethers = require('ethers');

const deployENS = require('./deployment/deploy-ens')
const deployModules = require('./deployment/deploy-modules');
const deployFactory = require('./deployment/deploy-factory');
const deployWallet = require('./deployment/deploy-wallet');

const deployManager = require('./utils/argent-utils/deploy-manager');
const DeployManager = deployManager('ropsten'); 

const TokenTransfer = require('./build/TransferManager');
const TestContract = require('./build/TestContract');

const url = "http://localhost:8545";
const privateKey = '0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f';
const provider = new ethers.providers.JsonRpcProvider(url);
const sysWallet = new ethers.Wallet(privateKey, provider);


const testWallet = async () => {
    
    // Send funds to the wallet.
    /** 
    await DeployManager.wallet.sendTransaction({ 
        to: '0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e', 
        value: ethers.utils.bigNumberify('10000000') 
    });
    console.log('Funds sent.')
    */

    let walletBalance = await DeployManager.wallet.provider.getBalance('0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e')
    console.log('\n\n Wallet Balance: ', ethers.utils.formatEther(walletBalance) + ' ETH')


    // Instantiate transfer module.
    let transferModule = await DeployManager.deployer.wrapDeployedContract(TokenTransfer, DeployManager.config.modules.TokenTransfer)

    let limit = await transferModule.getCurrentLimit('0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e');
    console.log('\n\n Wallet limit: ', limit.toString())
    await transferModule.changeLimit('0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e', 10000000000000); // 10000000000000
    //await DeployManager.wallet.provider.send('evm_increaseTime', 10000000000000);
    // await DeployManager.wallet.provider.send('evm_mine');
    let newLimit = await transferModule.getCurrentLimit('0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e');
    console.log('\n\n new Wallet limit: ', newLimit.toString())


    let contract = await DeployManager.deployer.deploy(TestContract);
    let state = await contract.state()
    console.log('\n\n Initial state: ', state.toString())
    let dataToTransfer = contract.contract.interface.functions['setState'].encode(['100']);
    let contractCallParams = ['0x2b1051b5e2ECb39D89e0FaC8c9e967A9FAD4082e', contract.contractAddress, 0, dataToTransfer];
    let contractCallTx = await transferModule.callContract(...contractCallParams);
    let contractCallTxReceipt = await transferModule.verboseWaitForTransaction(contractCallTx);
    let newState = await contract.state()
    console.log('\n\n New state AFTER transaction: ', newState.toString())
}

let x = async () => {
    // await deployENS(DeployManager)
    // await deployModules('ropsten')
    // await deployFactory('ropsten')
    await deployWallet('ropsten')

}

// main()
testWallet()




// x()