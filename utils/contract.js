const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const Web3 = require('web3');
const contract = require('@truffle/contract');
const AppError = require('./AppError');
const { getCurrentProvider, getWallets } = require('./web3Provider');

const generateTokensArray = (length) => {
  const tokens = [];
  for (let i = 0; i < length; i += 1) {
    tokens.push(Web3.utils.randomHex(32));
  }
  return tokens;
};

const loadContractABI = async () => {
  const accounts = await getWallets();

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
  contractObject.setProvider(getCurrentProvider());
  contractObject.defaults({ from: accounts[0], gas: 4500000 });
  return contractObject;
};

const getContractInstance = async () => {
  const abi = await loadContractABI();
  const instance = await abi.deployed();
  return instance;
};

exports.getContractAddress = async () => {
  const VotingContract = await getContractInstance();
  return VotingContract.address;
};

exports.getVotingEvents = async (votingId, fromBlock = 'earliest') => {
  const VotingContract = await getContractInstance();
  const allEvents = await VotingContract.getPastEvents('allEvents', {
    fromBlock,
    toBlock: 'latest',
  });

  return allEvents.filter((event) => event.returnValues.votingId === votingId);
};

exports.createVoting = async (candidates, endTime) => {
  if (!candidates.length) {
    throw new AppError('Candidates must be an array of strings');
  }
  const votingId = Web3.utils.randomHex(32);
  const adminToken = Web3.utils.randomHex(32);

  const VotingContract = await getContractInstance();
  const result = await VotingContract.createVoting(
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
  const VotingContract = await getContractInstance();
  const result = await VotingContract.addTokens(
    votingId,
    adminToken,
    tokens.map((token) => Web3.utils.soliditySha3(token))
  );

  return { result, tokens };
};

exports.vote = async (votingId, candidate, token) => {
  const VotingContract = await getContractInstance();
  const vote = await VotingContract.vote(
    votingId,
    Web3.utils.utf8ToHex(candidate),
    token
  );

  return vote;
};

exports.startVoting = async (votingId, adminToken) => {
  const VotingContract = await getContractInstance();
  const result = await VotingContract.startVoting(votingId, adminToken);

  return result;
};

exports.getVotingResult = async (votingId, candidates) => {
  const VotingContract = await getContractInstance();

  const alreadyVoted = (await VotingContract.alreadyVoted(votingId)).toNumber();
  const votersTotal = (await VotingContract.votersTotal(votingId)).toNumber();

  const voteResult = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const candidate of candidates) {
    voteResult.push({
      name: candidate,
      votesNum: (
        await VotingContract.totalVotesFor(
          votingId,
          Web3.utils.utf8ToHex(candidate)
        )
      ).toNumber(),
    });
  }

  return { alreadyVoted, votersTotal, voteResult };
};
