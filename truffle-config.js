const HDWalletProvider = require('@truffle/hdwallet-provider');

const { PRIVATE_KEY, INFURA_KEY } = require('./config');

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '5777', // Any network (default: none)
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          PRIVATE_KEY,
          `https://ropsten.infura.io/v3/${INFURA_KEY}`
        ),
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          PRIVATE_KEY,
          `https://kovan.infura.io/v3/${INFURA_KEY}`
        ),
      network_id: 42,
      gas: 5500000,
      confirmations: 2,
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
