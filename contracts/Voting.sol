pragma solidity >=0.4.21 <0.7.0;


/// @title A voting smart contract
/// @author Vitaliy Protsyk
contract VotingPlatform {
    event TokensAdded(bytes32 votingId, uint256 numOfTokens);
    event VotingStarted(bytes32 votingId, uint256 time);
    event Voted(bytes32 votingId, bytes32 candidate, bytes32 token);
    event VotingCreated(
        bytes32 votingId,
        bytes32[] candidates,
        uint256 endTime
    );

    // Respresents a single candidate
    struct Candidate {
        bool isValid; // if true, that candidate is valid
        uint256 votesReceived; // number of votes givent to candidate
    }

    // Respresents a single token
    struct Token {
        bool isValid; // if true, that token is valid
        bool isUsed; // if true, that token was used previously
    }

    // Respresents a voting instance
    struct Voting {
        bool exists; //  if true - voting exists
        bool started; // if true - voting started
        // A state variable that stores all tokens
        mapping(bytes32 => Token) tokens;
        // Mapping that stores all candidates
        mapping(bytes32 => Candidate) candidates;
        uint256 votersTotal; // total number of all voters
        uint256 alreadyVoted; // it will represent how many people voted
        uint256 endTime; // timestamp of time when voting will be finished
        bytes32 adminToken; //admin's token
    }

    // Mapping that stores all votings instances
    mapping(bytes32 => Voting) votings;

    // Address of contract creator
    address private creator;

    constructor() public {
        creator = msg.sender;
    }

    /// @notice Creates a new voting
    /// @param votingId Id of voting
    /// @param adminToken Admin token
    /// @param candidates Array of candidates
    /// @param endTime timestamp of time when voting will be finished
    function createVoting(
        bytes32 votingId,
        bytes32 adminToken,
        bytes32[] memory candidates,
        uint256 endTime
    ) public {
        require(isCreator(), 'Not a creator`s address');
        require(
            !votingExists(votingId),
            'Voting with this id is already created'
        );
        require(candidates.length > 1, 'Required more than 1 candidate');
        require(inFuture(endTime), 'End time should be in the future');

        votings[votingId] = Voting(true, false, 0, 0, endTime, adminToken);

        for (uint256 i = 0; i < candidates.length; i++) {
            votings[votingId].candidates[candidates[i]] = Candidate(true, 0);
        }

        emit VotingCreated(votingId, candidates, endTime);
    }

    /// @notice Adds new `tokens` to voting
    /// @param votingId Id of voting
    /// @param adminToken Admin token
    /// @param tokens Array of encrypted tokenns
    function addTokens(
        bytes32 votingId,
        bytes32 adminToken,
        bytes32[] memory tokens
    ) public {
        require(isCreator(), 'Not a creator`s address');
        require(votingExists(votingId), 'Voting with this ID not exists');
        require(validAdminToken(votingId, adminToken), 'Invalid admin token');

        for (uint256 i = 0; i < tokens.length; i++) {
            votings[votingId].tokens[tokens[i]] = Token(true, false);
        }

        votings[votingId].votersTotal += tokens.length;

        emit TokensAdded(votingId, tokens.length);
    }

    /// @notice Starts voting
    /// @param votingId Id of voting
    /// @param adminToken Admin token
    function startVoting(bytes32 votingId, bytes32 adminToken) public {
        require(isCreator(), 'Not a creator`s address');
        require(votingExists(votingId), 'Voting with this ID not exists');
        require(validAdminToken(votingId, adminToken), 'Invalid admin token');
        require(!votingStarted(votingId), 'Voting is already started');

        votings[votingId].started = true;

        emit VotingStarted(votingId, now);
    }

    /// @notice Gives a vote to `candidate`
    /// @param votingId Id of voting
    /// @param candidate Name of candidate you want to choose
    /// @param token Your unhashed(!!!) token
    function vote(bytes32 votingId, bytes32 candidate, bytes32 token) public {
        // First of all we hash our token to get
        // information about it
        bytes32 encryptedToken = encryptToken(token);

        require(isCreator(), 'Not a creator`s address');
        require(votingExists(votingId), 'Voting with this ID not exists');
        require(votingStarted(votingId), 'Voting is not yet started');
        require(!votingFinished(votingId), 'This voting is finished');
        require(validCandidate(votingId, candidate), 'Invalid candidate');
        require(validToken(votingId, encryptedToken), 'Invalid token');
        require(
            !usedToken(votingId, encryptedToken),
            'This token is already used'
        );

        // If we pass all our validations than
        // we increment number of votes given to our candidate,
        // set out token as used and increment number of all given votes
        votings[votingId].candidates[candidate].votesReceived += 1;
        votings[votingId].tokens[encryptedToken].isUsed = true;
        votings[votingId].alreadyVoted += 1;

        emit Voted(votingId, candidate, token);
    }

    /// @notice Check if we have such token
    /// @param votingId Id of voting
    /// @param adminToken Admin unuencrypted token
    /// @return true if we have such token, false - if not
    function validAdminToken(bytes32 votingId, bytes32 adminToken)
        public
        view
        returns (bool)
    {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return encryptToken(adminToken) == votings[votingId].adminToken;
    }

    /// @notice Returns number of already voted voters
    /// @param votingId Id of voting
    /// @return Number of already voted voters
    function alreadyVoted(bytes32 votingId) public view returns (uint256) {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].alreadyVoted;
    }

    /// @notice Returns number of all voters
    /// @param votingId Id of voting
    /// @return number of all voters
    function votersTotal(bytes32 votingId) public view returns (uint256) {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].votersTotal;
    }

    /// @notice Returns time when voting will be finished
    /// @param votingId Id of voting
    /// @return time when voting will be finished
    function endTime(bytes32 votingId) public view returns (uint256) {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].endTime;
    }

    /// @notice Check if we have such voting
    /// @return true if we have such token, false - if not
    function isCreator() public view returns (bool) {
        return msg.sender == creator;
    }

    /// @notice Check if we have such voting
    /// @param votingId Id of voting
    /// @return true if we have such token, false - if not
    function votingExists(bytes32 votingId) public view returns (bool) {
        return votings[votingId].exists;
    }

    /// @notice Gives a number of votes that receives candidate
    /// @param votingId Id of voting
    /// @param candidate Name of candidate
    /// @return Number of votes
    function totalVotesFor(bytes32 votingId, bytes32 candidate)
        public
        view
        returns (uint256)
    {
        require(votingExists(votingId), 'Voting with this ID not exists');
        require(validCandidate(votingId, candidate), 'Invalid candidate');
        return votings[votingId].candidates[candidate].votesReceived;
    }

    /// @notice Check if there is a candidate with `candidate` name
    /// @param votingId Id of voting
    /// @param candidate Name of requested candidate
    /// @return true if we have candidate with such name, false - if not
    function validCandidate(bytes32 votingId, bytes32 candidate)
        public
        view
        returns (bool)
    {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].candidates[candidate].isValid;
    }

    /// @notice Check if we have such token
    /// @param votingId Id of voting
    /// @param token Your hashed token
    /// @return true if we have such token, false - if not
    function validToken(bytes32 votingId, bytes32 token)
        public
        view
        returns (bool)
    {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].tokens[token].isValid;
    }

    /// @notice Check if our token was previously used
    /// @param votingId Id of voting
    /// @param token Your hashed token
    /// @return true if this token was used, false - if not
    function usedToken(bytes32 votingId, bytes32 token)
        public
        view
        returns (bool)
    {
        require(votingExists(votingId), 'Voting with this ID not exists');
        require(validToken(votingId, token), 'Invalid token');
        return votings[votingId].tokens[token].isUsed;
    }

    /// @notice Check if voting is finished
    /// @param votingId Id of voting
    /// @return true if voting is finished, false - if not
    function votingFinished(bytes32 votingId) public view returns (bool) {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return currentTime() > votings[votingId].endTime;
    }

    /// @notice Check if voting is finished
    /// @param votingId Id of voting
    /// @return true if voting is finished, false - if not
    function votingStarted(bytes32 votingId) public view returns (bool) {
        require(votingExists(votingId), 'Voting with this ID not exists');
        return votings[votingId].started;
    }

    /// @notice Check if requested time is in future
    /// @param time Timestamp in milliseconds
    /// @return true if this time is in future, false - if not
    function inFuture(uint256 time) public view returns (bool) {
        return time - 1000 > currentTime();
    }

    /// @notice Get block timestamp time in milliseconds
    /// @return Block timestamp in milliseconds (rounded)
    function currentTime() public view returns (uint256) {
        return now * 1000;
    }

    /// @notice Hash provided token by keccak256 algorithm
    /// @param token User token
    /// @return Hashed user token
    function encryptToken(bytes32 token) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(token));
    }
}
