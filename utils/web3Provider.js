const Web3 = require('web3');
const { NODE_ENV } = require('../config');
const { networks } = require('../truffle-config');

exports.getCurrentProvider = () => {
  if (networks[NODE_ENV].provider) {
    return networks[NODE_ENV].provider();
  }
  return `http://${networks[NODE_ENV].host}:${networks[NODE_ENV].port}`;
};

exports.getWallets = async () => {
  const web3 = new Web3(this.getCurrentProvider());
  return await web3.eth.getAccounts();
};

exports.getBlockNumberByTx = async (tx) => {
  const web3 = new Web3(this.getCurrentProvider());
  const { blockNumber } = await web3.eth.getTransaction(tx);
  return blockNumber;
};

exports.isConnected = async () => {
  try {
    const web3 = new Web3(this.getCurrentProvider());
    const connection = await web3.eth.getNodeInfo();
    if (connection) return true;
  } catch (error) {
    return false;
  }
};

exports.getAccountBalance = async (walletAddress) => {
  const web3 = new Web3(this.getCurrentProvider());
  const balance = await web3.eth.getBalance(walletAddress);
  return web3.utils.fromWei(balance);
};
