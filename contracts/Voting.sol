pragma solidity >=0.4.21 <0.7.0;


/// @title A voting smart contract
/// @author Vitaliy Protsyk
contract VotingPlatform {
    // ==========================
    // EVENTS
    // ==========================
    event TokensAdded(bytes32 votingId, uint256 numOfTokens);
    event VotingStarted(bytes32 votingId, uint256 time);
    event Voted(bytes32 votingId, bytes32 candidate, bytes32 token);
    event VotingCreated(
        bytes32 votingId,
        bytes32[] candidates,
        uint256 endTime
    );

    // ==========================
    // STRUNCTS AND VARIABLES
    // ==========================

    // Respresents a single candidate
    struct Candidate {
        bool isValid;
        uint256 votesReceived;
    }

    // Respresents a single token
    struct Token {
        bool isValid;
        bool isUsed;
    }

    // Respresents a voting instance
    struct Voting {
        bool exists;
        bool started;
        mapping(bytes32 => Token) tokens;
        mapping(bytes32 => Candidate) candidates;
        uint256 votersTotal;
        uint256 alreadyVoted;
        uint256 endTime;
        bytes32 adminToken;
    }

    // Mapping that stores all votings instances
    mapping(bytes32 => Voting) votings;

    address private creator;

    // ==========================
    // MODIFIERS
    // ==========================

    modifier onlyCreator() {
        require(msg.sender == creator, 'Not a creator`s address');
        _;
    }

    modifier votingExists(bytes32 votingId) {
        require(votings[votingId].exists, 'Voting with this ID not exists');
        _;
    }

    modifier votindIdNotReserved(bytes32 votingId) {
        require(
            !votings[votingId].exists,
            'Voting with this ID already exists'
        );
        _;
    }

    modifier votingNotStarted(bytes32 votingId) {
        require(!votings[votingId].started, 'Voting is already started');
        _;
    }

    modifier votingStarted(bytes32 votingId) {
        require(votings[votingId].started, 'Voting is not started');
        _;
    }

    modifier votingNotFinished(bytes32 votingId) {
        require(
            currentTime() < votings[votingId].endTime,
            'This voting is finished'
        );
        _;
    }

    modifier validAdminToken(bytes32 votingId, bytes32 adminToken) {
        require(
            encryptToken(adminToken) == votings[votingId].adminToken,
            'Invalid admin token'
        );
        _;
    }

    modifier moreThanOneCandidate(bytes32[] memory candidates) {
        require(candidates.length > 1, 'Required more than 1 candidate');
        _;
    }

    modifier inFuture(uint256 time) {
        require(
            time - 1000 > currentTime(),
            'End time should be in the future'
        );
        _;
    }

    modifier validToken(bytes32 votingId, bytes32 token) {
        require(
            votings[votingId].tokens[encryptToken(token)].isValid,
            'Invalid token'
        );
        _;
    }

    modifier notUsedToken(bytes32 votingId, bytes32 token) {
        require(
            !votings[votingId].tokens[encryptToken(token)].isUsed,
            'This token was used previously'
        );
        _;
    }

    modifier validCandidate(bytes32 votingId, bytes32 candidate) {
        require(
            votings[votingId].candidates[candidate].isValid,
            'Invalid candidate'
        );
        _;
    }

    // ==========================
    // FUNCTIONS
    // ==========================

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
    )
        public
        onlyCreator()
        votindIdNotReserved(votingId)
        moreThanOneCandidate(candidates)
        inFuture(endTime)
    {
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
    )
        public
        onlyCreator()
        votingExists(votingId)
        validAdminToken(votingId, adminToken)
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            votings[votingId].tokens[tokens[i]] = Token(true, false);
        }

        votings[votingId].votersTotal += tokens.length;

        emit TokensAdded(votingId, tokens.length);
    }

    /// @notice Starts voting
    /// @param votingId Id of voting
    /// @param adminToken Admin token
    function startVoting(bytes32 votingId, bytes32 adminToken)
        public
        onlyCreator()
        votingExists(votingId)
        validAdminToken(votingId, adminToken)
        votingNotStarted(votingId)
    {
        votings[votingId].started = true;
        emit VotingStarted(votingId, now);
    }

    /// @notice Gives a vote to `candidate`
    /// @param votingId Id of voting
    /// @param candidate Name of candidate you want to choose
    /// @param token Your unhashed(!!!) token
    function vote(bytes32 votingId, bytes32 candidate, bytes32 token)
        public
        onlyCreator()
        votingExists(votingId)
        votingStarted(votingId)
        votingNotFinished(votingId)
        validCandidate(votingId, candidate)
        validToken(votingId, token)
        notUsedToken(votingId, token)
    {
        votings[votingId].candidates[candidate].votesReceived += 1;
        votings[votingId].tokens[encryptToken(token)].isUsed = true;
        votings[votingId].alreadyVoted += 1;

        emit Voted(votingId, candidate, token);
    }

    /// @notice Returns number of already voted voters
    /// @param votingId Id of voting
    /// @return Number of already voted voters
    function alreadyVoted(bytes32 votingId)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].alreadyVoted;
    }

    /// @notice Returns number of all voters
    /// @param votingId Id of voting
    /// @return number of all voters
    function votersTotal(bytes32 votingId)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].votersTotal;
    }

    /// @notice Returns time when voting will be finished
    /// @param votingId Id of voting
    /// @return time when voting will be finished
    function endTime(bytes32 votingId)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].endTime;
    }

    /// @notice Gives a number of votes that receives candidate
    /// @param votingId Id of voting
    /// @param candidate Name of candidate
    /// @return Number of votes
    function totalVotesFor(bytes32 votingId, bytes32 candidate)
        public
        view
        votingExists(votingId)
        validCandidate(votingId, candidate)
        returns (uint256)
    {
        return votings[votingId].candidates[candidate].votesReceived;
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
