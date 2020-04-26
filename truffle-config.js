const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');

const { INFURA_KEY, MNEMONIC } = require('./config');

module.exports = {
  networks: {
    development: {
      provider: () =>
        ganache.provider({
          db_path: './ganache-db',
          network_id: 5777,
          mnemonic: MNEMONIC,
        }),
      network_id: 5777,
    },
    production: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://kovan.infura.io/v3/${INFURA_KEY}`
        ),
      network_id: 42,
      gas: 5500000,
      confirmations: 1,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      // version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },
};
