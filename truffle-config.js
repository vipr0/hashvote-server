const Web3 = require('web3');
const net = require('net');
const ganache = require('ganache-cli');

const { MNEMONIC, NODE_IPC_PATH } = require('./config');

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
      provider: () => new Web3.providers.IpcProvider(NODE_IPC_PATH, net),
      network_id: '*',
      gas: 5500000,
      confirmations: 1,
    },
  },
};
