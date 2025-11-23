const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Utility script for interacting with deployed contracts
 */

async function loadDeployment(network) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const filepath = path.join(deploymentsDir, `${network}-latest.json`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`No deployment found for network: ${network}`);
  }

  const deployment = JSON.parse(fs.readFileSync(filepath, "utf8"));
  return deployment;
}

async function getBountyInfo(bountyId) {
  const deployment = await loadDeployment(hre.network.name);
  const bountyManager = await hre.ethers.getContractAt(
    "BountyManager",
    deployment.contracts.BountyManager
  );

  const bounty = await bountyManager.bounties(bountyId);

  console.log("\n📋 Bounty Information");
  console.log("=".repeat(80));
  console.log("Bounty ID:", bountyId);
  console.log("Company:", bounty.company);
  console.log("Target Contract:", bounty.targetContract);
  console.log("Total Reward:", hre.ethers.formatUnits(bounty.totalReward, 6), "USDT");
  console.log("Remaining Reward:", hre.ethers.formatUnits(bounty.remainingReward, 6), "USDT");
  console.log("Lock Amount:", hre.ethers.formatUnits(bounty.lockAmount, 6), "USDT");
  console.log("Status:", getStatusName(bounty.status));
  console.log("Is Active:", bounty.isActive);
  console.log("Created At:", new Date(Number(bounty.createdAt) * 1000).toLocaleString());
  console.log("Deadline:", new Date(Number(bounty.deadline) * 1000).toLocaleString());
  console.log("=".repeat(80) + "\n");
}

async function getSubmissionInfo(submissionId) {
  const deployment = await loadDeployment(hre.network.name);
  const bountyManager = await hre.ethers.getContractAt(
    "BountyManager",
    deployment.contracts.BountyManager
  );

  const submission = await bountyManager.submissions(submissionId);

  console.log("\n🔍 Submission Information");
  console.log("=".repeat(80));
  console.log("Submission ID:", submissionId);
  console.log("Bounty ID:", submission.bountyId.toString());
  console.log("Hunter:", submission.hunter);
  console.log("Severity:", getSeverityName(submission.severity));
  console.log("Status:", getStatusName(submission.status));
  console.log("Reward Amount:", hre.ethers.formatUnits(submission.rewardAmount, 6), "USDT");
  console.log("Is Paid:", submission.isPaid);
  console.log("Submitted At:", new Date(Number(submission.submittedAt) * 1000).toLocaleString());
  console.log("=".repeat(80) + "\n");
}

async function getHunterInfo(hunterAddress) {
  const deployment = await loadDeployment(hre.network.name);
  const bountyManager = await hre.ethers.getContractAt(
    "BountyManager",
    deployment.contracts.BountyManager
  );

  const hunter = await bountyManager.hunters(hunterAddress);
  const submissions = await bountyManager.getHunterSubmissions(hunterAddress);

  console.log("\n🎯 Hunter Information");
  console.log("=".repeat(80));
  console.log("Hunter Address:", hunterAddress);
  console.log("Total Earned:", hre.ethers.formatUnits(hunter.totalEarned, 6), "USDT");
  console.log("Successful Submissions:", hunter.successfulSubmissions.toString());
  console.log("Reputation Score:", hunter.reputation.toString());
  console.log("Is Active:", hunter.isActive);
  console.log("Total Submissions:", submissions.length);
  console.log("=".repeat(80) + "\n");
}

async function getValidatorInfo(validatorAddress) {
  const deployment = await loadDeployment(hre.network.name);
  const validator = await hre.ethers.getContractAt(
    "VulnerabilityValidator",
    deployment.contracts.VulnerabilityValidator
  );

  const stats = await validator.getValidatorStats(validatorAddress);

  console.log("\n✅ Validator Information");
  console.log("=".repeat(80));
  console.log("Validator Address:", validatorAddress);
  console.log("Reputation Score:", stats.reputation.toString());
  console.log("Total Validations:", stats.totalValidations.toString());
  console.log("=".repeat(80) + "\n");
}

async function getVaultBalance(tokenAddress) {
  const deployment = await loadDeployment(hre.network.name);
  const vaultManager = await hre.ethers.getContractAt(
    "VaultManager",
    deployment.contracts.VaultManager
  );

  const balance = await vaultManager.getVaultBalance(tokenAddress);

  console.log("\n💰 Vault Balance");
  console.log("=".repeat(80));
  console.log("Token Address:", tokenAddress);
  console.log("Total Deposited:", hre.ethers.formatUnits(balance.totalDeposited, 6), "tokens");
  console.log("Total Withdrawn:", hre.ethers.formatUnits(balance.totalWithdrawn, 6), "tokens");
  console.log("Available Balance:", hre.ethers.formatUnits(balance.availableBalance, 6), "tokens");
  console.log("=".repeat(80) + "\n");
}

async function getApprovalStatus(requestId) {
  const deployment = await loadDeployment(hre.network.name);
  const multiSig = await hre.ethers.getContractAt(
    "MultiSigApproval",
    deployment.contracts.MultiSigApproval
  );

  const status = await multiSig.getApprovalStatus(requestId);

  console.log("\n🔐 Approval Status");
  console.log("=".repeat(80));
  console.log("Request ID:", requestId);
  console.log("Requester:", status.requester);
  console.log("Request Type:", hre.ethers.decodeBytes32String(status.requestType));
  console.log("Approval Count:", status.approvalCount.toString());
  console.log("Is Executed:", status.isExecuted);
  console.log("Is Cancelled:", status.isCancelled);
  console.log("Wallet 1 Approved:", status.wallet1Approved);
  console.log("Wallet 2 Approved:", status.wallet2Approved);
  console.log("Wallet 3 Approved:", status.wallet3Approved);
  console.log("=".repeat(80) + "\n");
}

async function getStakeInfo(userAddress) {
  const deployment = await loadDeployment(hre.network.name);
  const crimeToken = await hre.ethers.getContractAt(
    "CRIMEToken",
    deployment.contracts.CRIMEToken
  );

  const stakeInfo = await crimeToken.getStakeInfo(userAddress);

  console.log("\n💎 Staking Information");
  console.log("=".repeat(80));
  console.log("User Address:", userAddress);
  console.log("Staked Amount:", hre.ethers.formatEther(stakeInfo.amount), "CRIME");
  console.log("Staked At:", new Date(Number(stakeInfo.stakedAt) * 1000).toLocaleString());
  console.log("Pending Rewards:", hre.ethers.formatEther(stakeInfo.pendingReward), "CRIME");
  console.log("Total Earned:", hre.ethers.formatEther(stakeInfo.totalEarned), "CRIME");
  console.log("=".repeat(80) + "\n");
}

// Helper functions
function getStatusName(status) {
  const statuses = ["Active", "Dinilai", "Valid", "Invalid", "Completed", "Cancelled"];
  return statuses[status] || "Unknown";
}

function getSeverityName(severity) {
  const severities = ["None", "Low", "Medium", "High"];
  return severities[severity] || "Unknown";
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("\n📚 Usage:");
    console.log("  node scripts/interact.js bounty <bountyId>");
    console.log("  node scripts/interact.js submission <submissionId>");
    console.log("  node scripts/interact.js hunter <hunterAddress>");
    console.log("  node scripts/interact.js validator <validatorAddress>");
    console.log("  node scripts/interact.js vault <tokenAddress>");
    console.log("  node scripts/interact.js approval <requestId>");
    console.log("  node scripts/interact.js stake <userAddress>");
    console.log("");
    return;
  }

  const command = args[0];
  const param = args[1];

  try {
    switch (command) {
      case "bounty":
        await getBountyInfo(param);
        break;
      case "submission":
        await getSubmissionInfo(param);
        break;
      case "hunter":
        await getHunterInfo(param);
        break;
      case "validator":
        await getValidatorInfo(param);
        break;
      case "vault":
        await getVaultBalance(param);
        break;
      case "approval":
        await getApprovalStatus(param);
        break;
      case "stake":
        await getStakeInfo(param);
        break;
      default:
        console.log("❌ Unknown command:", command);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  getBountyInfo,
  getSubmissionInfo,
  getHunterInfo,
  getValidatorInfo,
  getVaultBalance,
  getApprovalStatus,
  getStakeInfo,
};
