const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Proof of Crime Smart Contract Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("🌐 Network:", hre.network.name);
  console.log("\n" + "=".repeat(80) + "\n");

  // Get multi-sig wallet addresses from env or use deployer as fallback
  const wallet1 = process.env.WALLET_1_ADDRESS || deployer.address;
  const wallet2 = process.env.WALLET_2_ADDRESS || deployer.address;
  const wallet3 = process.env.WALLET_3_ADDRESS || deployer.address;

  console.log("👛 Multi-Sig Wallets:");
  console.log("   Wallet 1 (Company):", wallet1);
  console.log("   Wallet 2 (DApp):", wallet2);
  console.log("   Wallet 3 (Professional):", wallet3);
  console.log("\n" + "=".repeat(80) + "\n");

  // Deploy contracts
  const deployedContracts = {};

  // 1. Deploy CRIME Token
  console.log("📝 Deploying CRIME Token...");
  const CRIMEToken = await hre.ethers.getContractFactory("CRIMEToken");
  const crimeToken = await CRIMEToken.deploy();
  await crimeToken.waitForDeployment();
  const crimeTokenAddress = await crimeToken.getAddress();
  deployedContracts.CRIMEToken = crimeTokenAddress;
  console.log("✅ CRIME Token deployed to:", crimeTokenAddress);
  console.log("");

  // 2. Deploy VaultManager
  console.log("📝 Deploying VaultManager...");
  const VaultManager = await hre.ethers.getContractFactory("VaultManager");
  const vaultManager = await VaultManager.deploy();
  await vaultManager.waitForDeployment();
  const vaultManagerAddress = await vaultManager.getAddress();
  deployedContracts.VaultManager = vaultManagerAddress;
  console.log("✅ VaultManager deployed to:", vaultManagerAddress);
  console.log("");

  // 3. Deploy MultiSigApproval
  console.log("📝 Deploying MultiSigApproval...");
  const MultiSigApproval = await hre.ethers.getContractFactory("MultiSigApproval");
  const multiSigApproval = await MultiSigApproval.deploy(wallet1, wallet2, wallet3);
  await multiSigApproval.waitForDeployment();
  const multiSigApprovalAddress = await multiSigApproval.getAddress();
  deployedContracts.MultiSigApproval = multiSigApprovalAddress;
  console.log("✅ MultiSigApproval deployed to:", multiSigApprovalAddress);
  console.log("");

  // 4. Deploy VulnerabilityValidator
  console.log("📝 Deploying VulnerabilityValidator...");
  const VulnerabilityValidator = await hre.ethers.getContractFactory("VulnerabilityValidator");
  const vulnerabilityValidator = await VulnerabilityValidator.deploy();
  await vulnerabilityValidator.waitForDeployment();
  const vulnerabilityValidatorAddress = await vulnerabilityValidator.getAddress();
  deployedContracts.VulnerabilityValidator = vulnerabilityValidatorAddress;
  console.log("✅ VulnerabilityValidator deployed to:", vulnerabilityValidatorAddress);
  console.log("");

  // 5. Deploy BountyManager
  console.log("📝 Deploying BountyManager...");
  const BountyManager = await hre.ethers.getContractFactory("BountyManager");
  const bountyManager = await BountyManager.deploy(vaultManagerAddress);
  await bountyManager.waitForDeployment();
  const bountyManagerAddress = await bountyManager.getAddress();
  deployedContracts.BountyManager = bountyManagerAddress;
  console.log("✅ BountyManager deployed to:", bountyManagerAddress);
  console.log("");

  console.log("=".repeat(80) + "\n");
  console.log("🔧 Configuring contracts...\n");

  // Configure VaultManager
  console.log("⚙️  Setting BountyManager in VaultManager...");
  await vaultManager.setBountyManager(bountyManagerAddress);
  console.log("✅ VaultManager configured");
  console.log("");

  // Configure VaultManager with MultiSig
  console.log("⚙️  Setting MultiSigApproval in VaultManager...");
  await vaultManager.setMultiSigApproval(multiSigApprovalAddress);
  console.log("✅ MultiSigApproval configured in VaultManager");
  console.log("");

  // Configure BountyManager
  console.log("⚙️  Setting VulnerabilityValidator in BountyManager...");
  await bountyManager.setValidatorContract(vulnerabilityValidatorAddress);
  console.log("✅ BountyManager configured");
  console.log("");

  // Configure VulnerabilityValidator
  console.log("⚙️  Setting BountyManager in VulnerabilityValidator...");
  await vulnerabilityValidator.setBountyManager(bountyManagerAddress);
  console.log("✅ VulnerabilityValidator configured");
  console.log("");

  // Add deployer as initial validator
  console.log("⚙️  Adding deployer as initial validator...");
  await vulnerabilityValidator.addValidator(deployer.address);
  console.log("✅ Initial validator added");
  console.log("");

  console.log("=".repeat(80) + "\n");
  console.log("📊 Deployment Summary\n");
  console.log("=".repeat(80));

  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(30)} : ${address}`);
  });

  console.log("=".repeat(80) + "\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    multiSigWallets: {
      wallet1,
      wallet2,
      wallet3,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Deployment info saved to: ${filepath}\n`);

  // Save latest deployment
  const latestFilepath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Latest deployment saved to: ${latestFilepath}\n`);

  console.log("=".repeat(80));
  console.log("✨ Deployment completed successfully!");
  console.log("=".repeat(80) + "\n");

  // Print verification commands
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("📋 To verify contracts on Etherscan, run:\n");
    console.log(`npx hardhat verify --network ${hre.network.name} ${crimeTokenAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${vaultManagerAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${multiSigApprovalAddress} "${wallet1}" "${wallet2}" "${wallet3}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${vulnerabilityValidatorAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${bountyManagerAddress} "${vaultManagerAddress}"`);
    console.log("");
  }

  return deployedContracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
