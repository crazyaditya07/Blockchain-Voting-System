// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    enum ProposalStatus { Active, Ended, Passed, Rejected }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        ProposalStatus status;
    }

    mapping(address => bool) public isRegisteredVoter;
    uint256 public proposalCount;
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event VoterRegistered(address indexed voter);
    event ProposalCreated(uint256 indexed proposalId, string title, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalEnded(uint256 indexed proposalId, ProposalStatus status);

    constructor() Ownable(msg.sender) {}

    function registerVoter(address _voter) public onlyOwner {
        require(!isRegisteredVoter[_voter], "Voter already registered");
        isRegisteredVoter[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function createProposal(string memory _title, string memory _description, uint256 _duration) public onlyOwner {
        uint256 id = proposalCount++;
        proposals.push(Proposal({
            id: id,
            title: _title,
            description: _description,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            yesVotes: 0,
            noVotes: 0,
            status: ProposalStatus.Active
        }));
        emit ProposalCreated(id, _title, _description);
    }

    function vote(uint256 _proposalId, bool _support) public {
        require(isRegisteredVoter[msg.sender], "Not a registered voter");
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");
        require(_proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage p = proposals[_proposalId];
        require(p.status == ProposalStatus.Active, "Proposal is not active");
        require(block.timestamp <= p.endTime, "Voting period has ended");

        hasVoted[_proposalId][msg.sender] = true;
        if (_support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }
        emit Voted(_proposalId, msg.sender, _support);
    }

    function endProposal(uint256 _proposalId) public {
        require(_proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage p = proposals[_proposalId];
        require(p.status == ProposalStatus.Active, "Proposal is not active");
        require(block.timestamp > p.endTime, "Voting period has not ended yet");

        if (p.yesVotes > p.noVotes) {
            p.status = ProposalStatus.Passed;
        } else {
            p.status = ProposalStatus.Rejected;
        }
        emit ProposalEnded(_proposalId, p.status);
    }

    function getProposal(uint256 _id) public view returns (Proposal memory) {
        require(_id < proposalCount, "Invalid proposal ID");
        return proposals[_id];
    }

    function getVoteCounts(uint256 _id) public view returns (uint256 yes, uint256 no) {
        require(_id < proposalCount, "Invalid proposal ID");
        Proposal memory p = proposals[_id];
        return (p.yesVotes, p.noVotes);
    }
}