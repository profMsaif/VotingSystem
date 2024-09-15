// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        bool registered;
        bool voted;
        uint vote;
    }

    address public owner = 0x43535f2CB683eaa8585087DEEa6968AfaAd577b1;
    uint public totalVotes;
    bool public votingOpen;

    mapping(address => Voter) public voters;
    Candidate[] public candidates;

    event VoterRegistered(address voter);
    event Voted(address voter, uint candidateId);
    event VotingResult(uint candidateId, string name, uint voteCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this.");
        _;
    }

    modifier isVotingOpen() {
        require(votingOpen, "Voting is not open.");
        _;
    }

    constructor(string[] memory candidateNames) {
        owner = owner;
        votingOpen = false;
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate(i, candidateNames[i], 0));
        }
    }

    function registerVoter(address voter) public onlyOwner {
        require(!voters[voter].registered, "Voter already registered.");
        voters[voter] = Voter(true, false, 0);
        emit VoterRegistered(voter);
    }

    function openVoting() public onlyOwner {
        votingOpen = true;
    }

    function closeVoting() public onlyOwner {
        votingOpen = false;
    }

    function vote(uint candidateId) public isVotingOpen {
        Voter storage sender = voters[msg.sender];
        require(sender.registered, "You must be registered to vote.");
        require(!sender.voted, "You have already voted.");
        require(candidateId < candidates.length, "Invalid candidate.");

        sender.voted = true;
        sender.vote = candidateId;

        candidates[candidateId].voteCount += 1;
        totalVotes += 1;

        emit Voted(msg.sender, candidateId);
    }

    function getResults() public view returns (Candidate[] memory) {
        return candidates;
    }

    function announceResults() public onlyOwner {
        for (uint i = 0; i < candidates.length; i++) {
            emit VotingResult(candidates[i].id, candidates[i].name, candidates[i].voteCount);
        }
    }
}
