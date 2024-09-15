import { expect } from "chai";
import { ethers, network } from "hardhat";
import { VotingSystem } from "../typechain-types";

describe("VotingSystem", function () {
  let votingSystem: VotingSystem;
  // the owner address is hard coded
  const owner = "0x43535f2CB683eaa8585087DEEa6968AfaAd577b1";
  let addr1: any;
  let addr2: any;

  before(async () => {
    [addr1, addr2] = await ethers.getSigners();
    const votingSystemFactory = await ethers.getContractFactory("VotingSystem");
    votingSystem = (await votingSystemFactory.deploy(["Dogs", "Cats"])) as VotingSystem;
    await votingSystem.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have voting closed initially", async function () {
      expect(await votingSystem.votingOpen()).to.equal(false);
    });

    it("Should deploy with the correct owner", async function () {
      expect(await votingSystem.owner()).to.equal(owner);
    });

    it("Should initialize candidates correctly", async function () {
      const candidate1 = await votingSystem.candidates(0);
      const candidate2 = await votingSystem.candidates(1);

      expect(candidate1.name).to.equal("Dogs");
      expect(candidate1.voteCount).to.equal(0);

      expect(candidate2.name).to.equal("Cats");
      expect(candidate2.voteCount).to.equal(0);
    });
  });
  describe("OpenVoting", function () {
    it("Should open voting by the owner", async function () {
      // Impersonate the owner with a hardcoded address
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });

      const ownerSigner = await ethers.getSigner(owner);
      // Fund the owner account with ETH from addr1
      await addr1.sendTransaction({
        to: owner,
        value: ethers.parseEther("1"), // Use ethers.utils.parseEther instead of parseEther
      });
      // Connect as the owner and call openVoting
      await votingSystem.connect(ownerSigner).openVoting();
      expect(await votingSystem.votingOpen()).to.equal(true);

      // Stop impersonating the owner
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [owner],
      });
    });
  });
  describe("CloseVoting", function () {
    it("Should close voting by the owner", async function () {
      // Impersonate the owner with a hardcoded address
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });

      const ownerSigner = await ethers.getSigner(owner);

      // Ensure voting is open first
      await votingSystem.connect(ownerSigner).openVoting();
      expect(await votingSystem.votingOpen()).to.equal(true);

      // Close voting
      await votingSystem.connect(ownerSigner).closeVoting();
      expect(await votingSystem.votingOpen()).to.equal(false);

      // Stop impersonating the owner
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [owner],
      });
    });

    it("Should revert if non-owner tries to close voting", async function () {
      await expect(votingSystem.connect(addr1).closeVoting()).to.be.revertedWith("Only owner can call this.");
    });
  });
  describe("RegisterVoter", function () {
    it("Should register a voter by the owner", async function () {
      // Impersonate the owner with a hardcoded address
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });

      const ownerSigner = await ethers.getSigner(owner);

      // Register a voter
      await votingSystem.connect(ownerSigner).registerVoter(addr1.address);
      const voter = await votingSystem.voters(addr1.address);
      expect(voter.registered).to.equal(true);
      expect(voter.voted).to.equal(false);

      // Stop impersonating the owner
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [owner],
      });
    });

    it("Should revert if non-owner tries to register a voter", async function () {
      await expect(votingSystem.connect(addr1).registerVoter(addr2.address)).to.be.revertedWith(
        "Only owner can call this.",
      );
    });
  });

  describe("Vote", function () {
    it("Should allow a registered voter to vote", async function () {
      // Impersonate the owner to register a voter and open voting
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });

      const ownerSigner = await ethers.getSigner(owner);

      // Check if the voter is already registered
      const voterInfo = await votingSystem.voters(addr1.address);
      if (!voterInfo.registered) {
        // Register the voter only if not already registered
        await votingSystem.connect(ownerSigner).registerVoter(addr1.address);
      }

      // Open voting
      await votingSystem.connect(ownerSigner).openVoting();

      // Stop impersonating the owner
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [owner],
      });

      // Connect as addr1 (registered voter) and vote for candidate 0
      await votingSystem.connect(addr1).vote(0);
      const candidate = await votingSystem.candidates(0);
      expect(candidate.voteCount).to.equal(1);

      const voter = await votingSystem.voters(addr1.address);
      expect(voter.voted).to.equal(true);
      expect(voter.vote).to.equal(0);
    });

    it("Should revert if a non-registered voter tries to vote", async function () {
      await expect(votingSystem.connect(addr2).vote(0)).to.be.revertedWith("You must be registered to vote.");
    });

    it("Should revert if a voter tries to vote twice", async function () {
      // Impersonate the owner to register a voter and open voting
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });

      const ownerSigner = await ethers.getSigner(owner);

      // Check if the voter is already registered
      const voterInfo = await votingSystem.voters(addr1.address);
      if (!voterInfo.registered) {
        // Register the voter only if not already registered
        await votingSystem.connect(ownerSigner).registerVoter(addr1.address);
      }

      // Open voting
      await votingSystem.connect(ownerSigner).openVoting();

      // Stop impersonating the owner
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [owner],
      });

      // addr1 has already voted above
      await expect(votingSystem.connect(addr1).vote(0)).to.be.revertedWith("You have already voted.");
    });
  });
});
