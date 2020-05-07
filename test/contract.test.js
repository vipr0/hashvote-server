const Web3 = require('web3');
const { assert } = require('chai');

const VotingPlatform = artifacts.require('VotingPlatform');

contract('VotingPlatform', async (accounts) => {
  const tokens = [];
  for (let i = 0; i < 60; i += 1) {
    tokens.push(Web3.utils.randomHex(32));
  }
  const adminToken = Web3.utils.randomHex(32);
  const candidates = ['Candidate #1', 'Candidate #2', 'Candidate #3'];
  const votingId = Web3.utils.randomHex(32);
  const endTime = Date.now() + 1 * 24 * 60 * 60 * 1000;

  it('should create a new voting', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.createVoting(
      votingId,
      Web3.utils.soliditySha3(adminToken),
      candidates.map((name) => Web3.utils.utf8ToHex(name)),
      endTime,
      { from: accounts[0] }
    );

    assert.property(result, 'tx');
    assert.property(result, 'receipt');
  });

  it('should add 6 voting tokens', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.addTokens(
      votingId,
      adminToken,
      tokens.map((token) => Web3.utils.soliditySha3(token)),
      {
        from: accounts[0],
      }
    );

    assert.property(result, 'tx');
    assert.property(result, 'receipt');
  });

  it('should start voting', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.startVoting(votingId, adminToken);

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

  it('should throw error when entering used token', async () => {
    try {
      const contract = await VotingPlatform.deployed();
      await contract.vote(
        votingId,
        Web3.utils.utf8ToHex(candidates[1]),
        tokens[2]
      );
    } catch (error) {
      assert.match(error.message, /This token was used previously/);
    }
  });

  it('should return correct alredyVoted() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.alreadyVoted(votingId);

    assert.equal(result, 4);
  });

  it('should return correct votersTotal() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.votersTotal(votingId);

    assert.equal(result.toNumber(), 60);
  });

  it('should return correct endTime() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.endTime(votingId);

    assert.equal(result, endTime);
  });

  it('should return correct totalVotesFor() value', async () => {
    const contract = await VotingPlatform.deployed();
    const result = await contract.totalVotesFor(
      votingId,
      Web3.utils.utf8ToHex('Candidate #1')
    );

    assert.equal(result, 2);
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
