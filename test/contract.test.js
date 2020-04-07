const Web3 = require('web3');
const { assert } = require('chai');

const VotingPlatform = artifacts.require('VotingPlatform');

contract('VotingPlatform', async (accounts) => {
  const tokens = [];
  for (let i = 0; i < 6; i += 1) {
    tokens.push(web3.utils.randomHex(32));
  }
  const candidates = ['Rama', 'Nick', 'Jose'];
  const votingId = Web3.utils.randomHex(32);
  const endTime = Date.now() + 1 * 24 * 60 * 60 * 1000;

  it('should create a new voting', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.createVoting(
      votingId,
      candidates.map((name) => Web3.utils.utf8ToHex(name)),
      tokens.map((token) => Web3.utils.soliditySha3(token)),
      endTime,
      { from: accounts[0] }
    );

    assert.property(result, 'tx');
    assert.property(result, 'receipt');
  });

  it('should vote 4 times for candidates', async () => {
    const contract = await VotingPlatform.deployed();

    const vote1 = await contract.vote(
      votingId,
      Web3.utils.utf8ToHex(candidates[0]),
      tokens[0]
    );
    assert.property(vote1, 'tx');

    const vote2 = await contract.vote(
      votingId,
      Web3.utils.utf8ToHex(candidates[0]),
      tokens[1]
    );
    assert.property(vote2, 'tx');

    const vote3 = await contract.vote(
      votingId,
      Web3.utils.utf8ToHex(candidates[1]),
      tokens[2]
    );
    assert.property(vote3, 'tx');

    const vote4 = await contract.vote(
      votingId,
      Web3.utils.utf8ToHex(candidates[2]),
      tokens[3]
    );
    assert.property(vote4, 'tx');
  });

  it('should return correct alredyVoted() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.alreadyVoted(votingId);

    assert.equal(result, 4);
  });

  it('should return correct votersTotal() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.votersTotal(votingId);

    assert.equal(result, 6);
  });

  it('should return correct endTime() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.endTime(votingId);

    assert.equal(result, endTime);
  });

  it('should return correct votingExists() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.votingExists(votingId);

    assert.isTrue(result);
  });

  it('should return correct totalVotesFor() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.totalVotesFor(
      votingId,
      Web3.utils.utf8ToHex('Rama')
    );

    assert.equal(result, 2);
  });

  it('should return correct validCandidate() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.validCandidate(
      votingId,
      Web3.utils.utf8ToHex('Rama')
    );

    assert.isTrue(result);
  });

  it('should return correct validToken() value', async () => {
    const contract = await VotingPlatform.deployed();
    tokens.map(async (token) => {
      const result = await contract.validToken(
        votingId,
        Web3.utils.soliditySha3(token)
      );
      assert.isTrue(result);
    });

    const resultWrong = await contract.validToken(
      votingId,
      Web3.utils.soliditySha3(web3.utils.randomHex(32))
    );
    assert.isFalse(resultWrong);
  });

  it('should return correct usedToken() value', async () => {
    const contract = await VotingPlatform.deployed();
    const resultCorrect = await contract.usedToken(
      votingId,
      Web3.utils.soliditySha3(tokens[0])
    );
    assert.isTrue(resultCorrect);

    const resultWrong = await contract.usedToken(
      votingId,
      Web3.utils.soliditySha3(tokens[5])
    );
    assert.isFalse(resultWrong);
  });

  it('should return correct votingFinished() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.votingFinished(votingId);

    assert.isFalse(result);
  });

  it('should return correct inFuture() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.inFuture(Date.now() - 60 * 1000);

    assert.isFalse(result);
  });

  it('should return correct currentTime() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.currentTime();

    assert.isTrue(Web3.utils.isBN(result));
    assert.closeTo(result.toNumber(), Date.now(), 60 * 1000); // +/- 1 min
  });

  it('should return correct encryptToken() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.encryptToken(tokens[0]);

    assert.equal(
      result,
      Web3.utils.soliditySha3(tokens[0]),
      `result: ${result}`
    );
  });
});
