const fs = require('fs');

const updateConfigFile = (network, newConfig) => {
    let stringifiedConfig = JSON.stringify(newConfig)

    if (network === 'ganache') { fs.writeFileSync('./utils/argent-utils/config/ganache.json', stringifiedConfig) };

    if (network === 'ropsten') { fs.writeFileSync('./utils/argent-utils/config/ropsten.json', stringifiedConfig) };
}

module.exports = updateConfigFile;