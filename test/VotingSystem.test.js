const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("VotingSystem", function () {
    let VotingSystem, votingSystem, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        VotingSystem = await ethers.getContractFactory("VotingSystem");
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        votingSystem = await VotingSystem.deploy();
        await votingSystem.waitForDeployment();
    });

    describe("User Registration and Verification", function () {
        it("Should allow owner to register a voter", async function () {
            await votingSystem.registerVoter(addr1.address);
            expect(await votingSystem.isRegisteredVoter(addr1.address)).to.be.true;
        });

        it("Should emit VoterRegistered event", async function () {
            await expect(votingSystem.registerVoter(addr1.address))
                .to.emit(votingSystem, "VoterRegistered")
                .withArgs(addr1.address);
        });

        it("Should not allow registering the same voter twice", async function () {
            await votingSystem.registerVoter(addr1.address);
            await expect(votingSystem.registerVoter(addr1.address)).to.be.revertedWith("Voter already registered");
        });

        it("Should not allow non-owner to register voter", async function () {
            await expect(votingSystem.connect(addr1).registerVoter(addr2.address)).to.be.revertedWithCustomError(votingSystem, "OwnableUnauthorizedAccount");
        });
    });

    describe("Proposal Creation", function () {
        it("Should allow owner to create a proposal", async function () {
            const title = "Test Proposal";
            const description = "This is a test";
            const duration = 3600; // 1 hour
            await votingSystem.createProposal(title, description, duration);
            const proposal = await votingSystem.getProposal(0);
            expect(proposal.title).to.equal(title);
            expect(proposal.description).to.equal(description);
            expect(proposal.status).to.equal(0); // Active
        });

        it("Should emit ProposalCreated event", async function () {
            const title = "Test Proposal";
            const description = "This is a test";
            const duration = 3600;
            await expect(votingSystem.createProposal(title, description, duration))
                .to.emit(votingSystem, "ProposalCreated")
                .withArgs(0, title, description);
        });

        it("Should increment proposal count", async function () {
            await votingSystem.createProposal("Title", "Desc", 3600);
            expect(await votingSystem.proposalCount()).to.equal(1);
        });

        it("Should not allow non-owner to create proposal", async function () {
            await expect(votingSystem.connect(addr1).createProposal("Title", "Desc", 3600)).to.be.revertedWithCustomError(votingSystem, "OwnableUnauthorizedAccount");
        });
    });

    describe("Voting Mechanism", function () {
        beforeEach(async function () {
            await votingSystem.registerVoter(addr1.address);
            await votingSystem.registerVoter(addr2.address);
            await votingSystem.createProposal("Title", "Desc", 3600);
        });

        it("Should allow registered voter to vote yes", async function () {
            await votingSystem.connect(addr1).vote(0, true);
            const proposal = await votingSystem.getProposal(0);
            expect(proposal.yesVotes).to.equal(1);
            expect(proposal.noVotes).to.equal(0);
            expect(await votingSystem.hasVoted(0, addr1.address)).to.be.true;
        });

        it("Should allow registered voter to vote no", async function () {
            await votingSystem.connect(addr1).vote(0, false);
            const proposal = await votingSystem.getProposal(0);
            expect(proposal.yesVotes).to.equal(0);
            expect(proposal.noVotes).to.equal(1);
        });

        it("Should emit Voted event", async function () {
            await expect(votingSystem.connect(addr1).vote(0, true))
                .to.emit(votingSystem, "Voted")
                .withArgs(0, addr1.address, true);
        });

        it("Should not allow unregistered voter to vote", async function () {
            await expect(votingSystem.connect(addr3).vote(0, true)).to.be.revertedWith("Not a registered voter");
        });

        it("Should not allow voting twice on the same proposal", async function () {
            await votingSystem.connect(addr1).vote(0, true);
            await expect(votingSystem.connect(addr1).vote(0, false)).to.be.revertedWith("Already voted on this proposal");
        });

        it("Should not allow voting on invalid proposal ID", async function () {
            await expect(votingSystem.connect(addr1).vote(1, true)).to.be.revertedWith("Invalid proposal ID");
        });

        it("Should not allow voting on ended proposal", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            await expect(votingSystem.connect(addr1).vote(0, true)).to.be.revertedWith("Voting period has ended");
        });
    });

    describe("Proposal Status Tracking and Ending", function () {
        beforeEach(async function () {
            await votingSystem.registerVoter(addr1.address);
            await votingSystem.registerVoter(addr2.address);
            await votingSystem.createProposal("Title", "Desc", 3600);
        });

        it("Should end proposal and set status to Passed if yes > no", async function () {
            await votingSystem.connect(addr1).vote(0, true);
            await votingSystem.connect(addr2).vote(0, true);
            // Fast forward
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            await votingSystem.endProposal(0);
            const proposal = await votingSystem.getProposal(0);
            expect(proposal.status).to.equal(2); // Passed
        });

        it("Should end proposal and set status to Rejected if no >= yes", async function () {
            await votingSystem.connect(addr1).vote(0, false);
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            await votingSystem.endProposal(0);
            const proposal = await votingSystem.getProposal(0);
            expect(proposal.status).to.equal(3); // Rejected
        });

        it("Should emit ProposalEnded event", async function () {
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            await expect(votingSystem.endProposal(0))
                .to.emit(votingSystem, "ProposalEnded")
                .withArgs(0, 3); // Rejected since no votes
        });

        it("Should not end proposal before time", async function () {
            await expect(votingSystem.endProposal(0)).to.be.revertedWith("Voting period has not ended yet");
        });

        it("Should not end already ended proposal", async function () {
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            await votingSystem.endProposal(0);
            await expect(votingSystem.endProposal(0)).to.be.revertedWith("Proposal is not active");
        });

        it("Should not end invalid proposal", async function () {
            await expect(votingSystem.endProposal(1)).to.be.revertedWith("Invalid proposal ID");
        });
    });

    describe("Vote Counting", function () {
        beforeEach(async function () {
            await votingSystem.registerVoter(addr1.address);
            await votingSystem.registerVoter(addr2.address);
            await votingSystem.createProposal("Title", "Desc", 3600);
        });

        it("Should return correct vote counts", async function () {
            await votingSystem.connect(addr1).vote(0, true);
            await votingSystem.connect(addr2).vote(0, false);
            const counts = await votingSystem.getVoteCounts(0);
            expect(counts.yes).to.equal(1);
            expect(counts.no).to.equal(1);
        });

        it("Should return zero votes for new proposal", async function () {
            const counts = await votingSystem.getVoteCounts(0);
            expect(counts.yes).to.equal(0);
            expect(counts.no).to.equal(0);
        });

        it("Should revert for invalid proposal ID", async function () {
            await expect(votingSystem.getVoteCounts(1)).to.be.revertedWith("Invalid proposal ID");
        });
    });

    describe("Access Control", function () {
        it("Should set owner correctly", async function () {
            expect(await votingSystem.owner()).to.equal(owner.address);
        });

        it("Should allow owner to transfer ownership", async function () {
            await votingSystem.transferOwnership(addr1.address);
            expect(await votingSystem.owner()).to.equal(addr1.address);
        });

        it("Should not allow non-owner to transfer ownership", async function () {
            await expect(votingSystem.connect(addr1).transferOwnership(addr2.address)).to.be.revertedWithCustomError(votingSystem, "OwnableUnauthorizedAccount");
        });
    });
});