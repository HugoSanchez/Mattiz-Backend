const deployFactory = require('./deployment/deploy-factory');
const deployWallet = require('./deployment/deploy-wallet');
const deployModules = require('./deployment/deploy-modules');


async function main(){
    await deployModules('ganache')
    await deployFactory('ganache')
    await deployWallet('ganache')
} 

main()
