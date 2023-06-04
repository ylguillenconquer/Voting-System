// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    using SafeMath for uint256;

    struct Voter {
        address voter;
        address delegate;
        uint vote;
        bool voted;
    }

    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    mapping (address=>Voter) public voters;
    Proposal[] proposals;
    uint256 proposalCount;

    uint256[] winningProposal;

    modifier proposalExists(uint256 _proposalIndex) {
        require (_proposalIndex< proposalCount, "Voting System: Proposal index out of bounds");
        _;
    }

    modifier notYetVoted (address _voter) {
        require (!voters[_voter].voted, "Voting System: The voter has already voted");
        _;
    }

    event VotingStarted (address indexed _owner, uint256 _proposalCount);
    event VoteCasted (uint256 _proposalVoted, address indexed _voter);
    event DelegationSuccessfull(address indexed voter, address indexed delegate);

    constructor(string[] memory proposalNames, address[] memory voterAddress) {
        proposalCount = proposalNames.length;
        for (uint i = 0; i<proposalCount; i=i.add(1)) {
            Proposal memory proposal = Proposal (stringToBytes32(proposalNames[i]), 0);
            proposals.push(proposal);
        }

        for (uint i= 0; i<voterAddress.length; i=i.add(1)) {
            Voter memory voter = Voter (voterAddress[i],  address(0), 0, false);
            voters[voterAddress[i]] = voter;
        }

        emit VotingStarted(owner(), proposalCount);
    }


    function getProposal (uint256 _proposalIndex) public view proposalExists(_proposalIndex) returns (string memory _proposalName, uint256 _voteCount) {
        (_proposalName, _voteCount) = (bytes32ToString(proposals[_proposalIndex].name), proposals[_proposalIndex].voteCount);
    }

    function vote(address _voter, uint256 _proposalIndex) external proposalExists(_proposalIndex) notYetVoted(_voter) returns(bool) {
        Voter storage sender = voters[_voter];
        require (msg.sender == _voter || msg.sender == sender.delegate, "Voting System: This address does not have right to vote");

        sender.vote = _proposalIndex;
        proposals[_proposalIndex].voteCount = (proposals[_proposalIndex].voteCount).add(1);
        sender.voted = true; 

        emit VoteCasted(_proposalIndex, _voter);
        return true;
    }

    function delegate (address _to) external notYetVoted(msg.sender) {
        require (_to!=msg.sender, "Voting System: Self delegation is not allowed");
        Voter storage sender = voters[msg.sender];
        require(sender.voter != address(0), "Voting System: This address does not have right to vote");

        sender.delegate = _to;
        emit DelegationSuccessfull(msg.sender, _to);
    }

    function computeWinners() external onlyOwner {
        delete winningProposal;
        uint256 winningVoteCount = 0; 
        uint256 winner = 0;

        for (uint256 i = 0; i<proposals.length; i=i.add(1)) {
            if(proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winner = i;
            }
        }
        winningProposal.push(winner);

       for (uint256 i = 0; i<proposals.length; i=i.add(1)) { 
            if (proposals[i].voteCount == proposals[winner].voteCount && i!= winner) {
                winningProposal.push(i);
            }
       }
    }

    function getWinnerNames() external view returns (string[] memory _winnernames) {
        for (uint i = 0; i< winningProposal.length; i=i.add(1)) {
            _winnernames[i] = bytes32ToString(proposals[winningProposal[i]].name);
        }
    }

    function getWinningProposals()  external view returns(uint256[] memory) {
        return winningProposal;
    }





    function stringToBytes32(string memory str) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(str));
    }

    function bytes32ToString (bytes32 byt) internal pure returns (string memory) {
        return string (abi.encodePacked(byt));
    }


}