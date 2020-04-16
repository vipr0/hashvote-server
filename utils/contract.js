const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const contract = require('@truffle/contract');
const { PRIVATE_KEY, INFURA_KEY, NODE_ENV } = require('../config');
const AppError = require('./AppError');

const generateTokensArray = (length) => {
  const tokens = [];
  for (let i = 0; i < length; i += 1) {
    tokens.push(Web3.utils.randomHex(32));
  }
  return tokens;
};

const providers = {
  production: new HDWalletProvider(
    PRIVATE_KEY,
    `https://kovan.infura.io/v3/${INFURA_KEY}`
  ),
  development: new Web3.providers.HttpProvider('http://127.0.0.1:7545'),
};

const loadContract = async (provider) => {
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();

  const file = path.resolve(
    __dirname,
    '..',
    '',
    'build',
    'contracts',
    'VotingPlatform.json'
  );
  const json = await promisify(fs.readFile)(file, 'utf-8');

  const contractObject = contract(JSON.parse(json));
  contractObject.setProvider(provider);
  contractObject.defaults({ from: accounts[0], gas: 4500000 });
  return contractObject;
};

exports.isConnected = async () => {
  try {
    const web3 = new Web3(providers[NODE_ENV]);
    const connection = await web3.eth.getNodeInfo();
    if (connection) return true;
  } catch (error) {
    return false;
  }
};

exports.createVoting = async (candidates, endTime) => {
  if (typeof candidates !== 'object') {
    throw new AppError('Candidates must be an array of strings');
  }
  const votingId = Web3.utils.randomHex(32);
  const adminToken = Web3.utils.randomHex(32);

  const VotingPlatform = await loadContract(providers[NODE_ENV]);

  const instance = await VotingPlatform.deployed();
  const result = await instance.createVoting(
    votingId,
    Web3.utils.soliditySha3(adminToken),
    candidates.map((name) => Web3.utils.utf8ToHex(name)),
    endTime
  );

  result.votingId = votingId;
  result.adminToken = adminToken;

  return result;
};

exports.addTokens = async (votingId, adminToken, numOfTokens) => {
  const tokens = generateTokensArray(numOfTokens);
  const VotingPlatform = await loadContract(providers[NODE_ENV]);

  const instance = await VotingPlatform.deployed();
  const result = await instance.addTokens(
    votingId,
    adminToken,
    tokens.map((token) => Web3.utils.soliditySha3(token))
  );

  return { result, tokens };
};

exports.vote = async (votingId, candidate, token) => {
  const VotingPlatform = await loadContract(providers[NODE_ENV]);

  const instance = await VotingPlatform.deployed();
  const vote = await instance.vote(
    votingId,
    Web3.utils.utf8ToHex(candidate),
    token
  );

  return vote;
};

exports.startVoting = async (votingId, adminToken) => {
  const VotingPlatform = await loadContract(providers[NODE_ENV]);
  const instance = await VotingPlatform.deployed();

  const result = await instance.startVoting(votingId, adminToken);

  return result;
};

exports.getContractInfo = async (votingId) => {
  const VotingPlatform = await loadContract(providers[NODE_ENV]);
  const instance = await VotingPlatform.deployed();

  const alreadyVoted = (await instance.alreadyVoted(votingId)).toNumber();
  const votersTotal = (await instance.votersTotal(votingId)).toNumber();
  const endTime = (await instance.endTime(votingId)).toNumber();
  const votingExists = await instance.votingExists(votingId);
  const votingStarted = await instance.votingStarted(votingId);

  return { alreadyVoted, votersTotal, endTime, votingExists, votingStarted };
};

exports.totalVotesGiven = async (votingId, candidates) => {
  const result = {};
  const VotingPlatform = await loadContract(providers[NODE_ENV]);
  const instance = await VotingPlatform.deployed();

  // eslint-disable-next-line no-restricted-syntax
  for await (const candidate of candidates) {
    result[candidate] = (
      await instance.totalVotesFor(votingId, Web3.utils.utf8ToHex(candidate))
    ).toNumber();
  }

  return result;
};

exports.votingStarted = async (votingId) => {
  const VotingPlatform = await loadContract(providers[NODE_ENV]);
  const instance = await VotingPlatform.deployed();
  const result = await instance.votingStarted(votingId);

  return result;
};

exports.validAdminToken = async (votingId, adminToken) => {
  const VotingPlatform = await loadContract(providers[NODE_ENV]);
  const instance = await VotingPlatform.deployed();
  return await instance.validAdminToken(votingId, adminToken);
};
