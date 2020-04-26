/* eslint-disable camelcase */
const ganache = require('ganache-cli');
const Web3 = require('web3');
const { MNEMONIC } = require('./config');
const {
  host,
  port,
  network_id,
} = require('./truffle-config').networks.development;

const { BN } = Web3.utils;

const server = ganache.server({
  db_path: './ganache-db',
  network_id,
  mnemonic: MNEMONIC,
});

server.listen(port, host, function (err, state) {
  if (err) {
    console.log(err);
    return;
  }

  const { accounts, options } = state;

  console.log('');
  console.log('Paramenters');
  console.log('==================');
  console.log(`Network ID: ${options.network_id}`);
  console.log(`Gas price: ${Web3.utils.hexToNumber(options.gasPrice)}`);
  console.log(`Gas limit: ${Web3.utils.hexToNumber(options.gasLimit)}`);
  console.log(`HD Path: ${options.hdPath}`);
  console.log(`DB Path: ${options.db_path}`);

  console.log('');
  console.log('Available Accounts');
  console.log('==================');

  const addresses = Object.keys(accounts);

  addresses.forEach((address, i) => {
    console.log(
      `${i}. ${address}: ${Web3.utils.fromWei(
        new BN(accounts[address].account.balance)
      )}`
    );
  });

  console.log('');
  console.log(`Listening on ${host}:${port}`);
});
