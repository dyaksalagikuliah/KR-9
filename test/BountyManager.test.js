const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BountyManager", function () {
  let bountyManager;
  let vaultManager;
  let vulnerabilityValidator;
  let crimeToken;
  let mockUSDT;
  let owner;
  let company;
  let hunter;
  let validator;

  const LOCK_AMOUNT = ethers.parseUnits("100000", 6); // 100k USDT
  const REWARD_AMOUNT = ethers.parseUnits("50000", 6); // 50k USDT

  beforeEach(async function () {
    [owner, company, hunter, validator] = await ethers.getSigners();

    // Deploy Mock USDT
    const MockERC20 = await ethers.getContractFactory("CRIMEToken");
    mockUSDT = await MockERC20.deploy();
    await mockUSDT.waitForDeployment();

    // Mint USDT to company
    await mockUSDT.transfer(company.address, ethers.parseUnits("200000", 6));

    // Deploy VaultManager
    const VaultManager = await ethers.getContractFactory("VaultManager");
    vaultManager = await VaultManager.deploy();
    await vaultManager.waitForDeployment();

    // Deploy VulnerabilityValidator
    const VulnerabilityValidator = await ethers.getContractFactory("VulnerabilityValidator");
    vulnerabilityValidator = await VulnerabilityValidator.deploy();
    await vulnerabilityValidator.waitForDeployment();

    // Deploy BountyManager
    const BountyManager = await ethers.getContractFactory("BountyManager");
    bountyManager = await BountyManager.deploy(await vaultManager.getAddress());
    await bountyManager.waitForDeployment();

    // Configure contracts
    await vaultManager.setBountyManager(await bountyManager.getAddress());
    await bountyManager.setValidatorContract(await vulnerabilityValidator.getAddress());
    await vulnerabilityValidator.setBountyManager(await bountyManager.getAddress());

    // Add validator
    await vulnerabilityValidator.addValidator(validator.address);
  });

  describe("Bounty Creation", function () {
    it("Should create a bounty successfully", async function () {
      const deadline = (await time.latest()) + 30 * 24 * 60 * 60; // 30 days

      // Approve USDT spending
      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        LOCK_AMOUNT + REWARD_AMOUNT
      );

      // Create bounty
      await expect(
        bountyManager.connect(company).createBounty(
          "0x1234567890123456789012345678901234567890",
          REWARD_AMOUNT,
          deadline,
          await mockUSDT.getAddress()
        )
      )
        .to.emit(bountyManager, "BountyCreated")
        .withArgs(0, company.address, REWARD_AMOUNT);

      // Verify bounty details
      const bounty = await bountyManager.bounties(0);
      expect(bounty.company).to.equal(company.address);
      expect(bounty.totalReward).to.equal(REWARD_AMOUNT);
      expect(bounty.isActive).to.equal(true);
    });

    it("Should fail to create bounty with invalid deadline", async function () {
      const pastDeadline = (await time.latest()) - 100;

      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        LOCK_AMOUNT + REWARD_AMOUNT
      );

      await expect(
        bountyManager.connect(company).createBounty(
          "0x1234567890123456789012345678901234567890",
          REWARD_AMOUNT,
          pastDeadline,
          await mockUSDT.getAddress()
        )
      ).to.be.revertedWith("Invalid deadline");
    });

    it("Should fail without sufficient approval", async function () {
      const deadline = (await time.latest()) + 30 * 24 * 60 * 60;

      // Approve insufficient amount
      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        ethers.parseUnits("50000", 6)
      );

      await expect(
        bountyManager.connect(company).createBounty(
          "0x1234567890123456789012345678901234567890",
          REWARD_AMOUNT,
          deadline,
          await mockUSDT.getAddress()
        )
      ).to.be.reverted;
    });
  });

  describe("Hunter Registration", function () {
    it("Should register hunter successfully", async function () {
      await expect(bountyManager.connect(hunter).registerHunter())
        .to.emit(bountyManager, "HunterRegistered")
        .withArgs(hunter.address);

      const hunterInfo = await bountyManager.hunters(hunter.address);
      expect(hunterInfo.isActive).to.equal(true);
      expect(hunterInfo.totalEarned).to.equal(0);
    });

    it("Should fail to register twice", async function () {
      await bountyManager.connect(hunter).registerHunter();

      await expect(
        bountyManager.connect(hunter).registerHunter()
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("Submission Flow", function () {
    let bountyId;

    beforeEach(async function () {
      // Create bounty
      const deadline = (await time.latest()) + 30 * 24 * 60 * 60;
      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        LOCK_AMOUNT + REWARD_AMOUNT
      );

      await bountyManager.connect(company).createBounty(
        "0x1234567890123456789012345678901234567890",
        REWARD_AMOUNT,
        deadline,
        await mockUSDT.getAddress()
      );

      bountyId = 0;

      // Register hunter
      await bountyManager.connect(hunter).registerHunter();
    });

    it("Should submit finding successfully", async function () {
      await expect(
        bountyManager.connect(hunter).submitFinding(
          bountyId,
          "Reentrancy vulnerability found",
          "Detailed proof of concept..."
        )
      )
        .to.emit(bountyManager, "SubmissionCreated")
        .withArgs(0, bountyId, hunter.address);

      const submission = await bountyManager.submissions(0);
      expect(submission.bountyId).to.equal(bountyId);
      expect(submission.hunter).to.equal(hunter.address);
    });

    it("Should fail to submit without hunter registration", async function () {
      const [, , , unregistered] = await ethers.getSigners();

      await expect(
        bountyManager.connect(unregistered).submitFinding(
          bountyId,
          "Vulnerability",
          "PoC"
        )
      ).to.be.revertedWith("Not registered as hunter");
    });

    it("Should fail to submit to inactive bounty", async function () {
      // Complete the bounty
      await bountyManager.connect(company).completeBounty(bountyId);

      await expect(
        bountyManager.connect(hunter).submitFinding(
          bountyId,
          "Vulnerability",
          "PoC"
        )
      ).to.be.revertedWith("Bounty not active");
    });
  });

  describe("Validation and Rewards", function () {
    let bountyId;
    let submissionId;

    beforeEach(async function () {
      // Setup: Create bounty and submission
      const deadline = (await time.latest()) + 30 * 24 * 60 * 60;
      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        LOCK_AMOUNT + REWARD_AMOUNT
      );

      await bountyManager.connect(company).createBounty(
        "0x1234567890123456789012345678901234567890",
        REWARD_AMOUNT,
        deadline,
        await mockUSDT.getAddress()
      );

      bountyId = 0;
      await bountyManager.connect(hunter).registerHunter();

      await bountyManager.connect(hunter).submitFinding(
        bountyId,
        "Critical vulnerability",
        "PoC"
      );

      submissionId = 0;
    });

    it("Should validate submission as valid", async function () {
      // Validator validates submission
      await expect(
        bountyManager.validateSubmission(submissionId, 2, true) // High severity, valid
      )
        .to.emit(bountyManager, "SubmissionValidated")
        .withArgs(submissionId, 2, true);

      const submission = await bountyManager.submissions(submissionId);
      expect(submission.status).to.equal(2); // BountyStatus.Valid
    });

    it("Should validate submission as invalid", async function () {
      await bountyManager.validateSubmission(submissionId, 0, false);

      const submission = await bountyManager.submissions(submissionId);
      expect(submission.status).to.equal(3); // BountyStatus.Invalid
    });
  });

  describe("Platform Fee", function () {
    it("Should set platform fee correctly", async function () {
      await bountyManager.setPlatformFee(7);
      expect(await bountyManager.platformFeePercentage()).to.equal(7);
    });

    it("Should fail to set fee too high", async function () {
      await expect(
        bountyManager.setPlatformFee(15)
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      await bountyManager.pause();
      expect(await bountyManager.paused()).to.equal(true);

      await bountyManager.unpause();
      expect(await bountyManager.paused()).to.equal(false);
    });

    it("Should prevent bounty creation when paused", async function () {
      await bountyManager.pause();

      const deadline = (await time.latest()) + 30 * 24 * 60 * 60;
      await mockUSDT.connect(company).approve(
        await bountyManager.getAddress(),
        LOCK_AMOUNT + REWARD_AMOUNT
      );

      await expect(
        bountyManager.connect(company).createBounty(
          "0x1234567890123456789012345678901234567890",
          REWARD_AMOUNT,
          deadline,
          await mockUSDT.getAddress()
        )
      ).to.be.reverted;
    });
  });
});
