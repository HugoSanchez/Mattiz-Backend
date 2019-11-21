// Testing ground

require('dotenv').config();
const ethers = require('ethers');

const deployENS = require('./deployment/deploy-ens')
const deployManager = require('./utils/argent-utils/deploy-manager');
const DeployManager = deployManager('ganache');

/** 
const TokenTransfer = require('./build/TransferManager');
const TestContract = require('./build/TestContract');

const deployFactory = require('./deployment/deploy-factory');
const deployWallet = require('./deployment/deploy-wallet');
const deployModules = require('./deployment/deploy-modules');

const url = "http://localhost:8545";
const privateKey = '0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f';
const provider = new ethers.providers.JsonRpcProvider(url);
const sysWallet = new ethers.Wallet(privateKey, provider);





async function main(){
   //  await deployModules('ganache')
   //  await deployFactory('ganache')
   //  await deployWallet('ganache')
}

const testWallet = async () => {
    
    // Send funds to the wallet.
    await sysWallet.sendTransaction({ 
        to: '0x36c7831798E7C0670603A81abdf426bA2b0BaF2D', 
        value: ethers.utils.bigNumberify('1000000000000000000') 
    });
    let walletBalance = await DeployManager.provider.getBalance('0x36c7831798E7C0670603A81abdf426bA2b0BaF2D')
    console.log('\n\n Wallet Balance: ', ethers.utils.formatEther(walletBalance) + ' ETH')


    // Instantiate transfer module.
    let transferModule = await DeployManager.wrapDeployedContract(TokenTransfer, config.modules.TokenTransfer)

    let limit = await transferModule.getCurrentLimit('0x36c7831798E7C0670603A81abdf426bA2b0BaF2D');
    console.log('\n\n Wallet limit: ', limit.toString())
    await transferModule.from(sysWallet).changeLimit('0x36c7831798E7C0670603A81abdf426bA2b0BaF2D', 10000000000000); // 10000000000000
    await DeployManager.provider.send('evm_increaseTime', 10000000000000);
    await DeployManager.provider.send('evm_mine');
    let newLimit = await transferModule.getCurrentLimit('0x36c7831798E7C0670603A81abdf426bA2b0BaF2D');
    console.log('\n\n new Wallet limit: ', newLimit.toString())


    let contract = await DeployManager.deploy(TestContract);
    let state = await contract.state()
    console.log('\n\n Initial state: ', state.toString())
    let dataToTransfer = contract.contract.interface.functions['setState'].encode(['100']);
    let contractCallParams = ['0x36c7831798E7C0670603A81abdf426bA2b0BaF2D', contract.contractAddress, 0, dataToTransfer];
    let contractCallTx = await transferModule.from(sysWallet).callContract(...contractCallParams);
    let contractCallTxReceipt = await transferModule.verboseWaitForTransaction(contractCallTx);
    let newState = await contract.state()
    console.log('\n\n New state AFTER transaction: ', newState.toString())
}

*/
let x = async () => {
    let balance = await DeployManager.wallet.getBalance();
    console.log(balance.toString())

}

// main()
// testWallet()

deployENS(DeployManager)


// x()