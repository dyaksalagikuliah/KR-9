#!/usr/bin/env node

/**
 * Copy Contract ABIs to Backend
 * Run this after compiling contracts: node scripts/copy-abis.js
 */

const fs = require('fs');
const path = require('path');

const CONTRACTS = [
  'BountyManager',
  'VaultManager',
  'VulnerabilityValidator',
  'MultiSigApproval',
  'CRIMEToken',
];

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts');
const BACKEND_ABI_DIR = path.join(__dirname, '../backend/src/contracts/abis');

console.log('📦 Copying Contract ABIs to Backend...\n');

// Create backend ABIs directory if not exists
if (!fs.existsSync(BACKEND_ABI_DIR)) {
  fs.mkdirSync(BACKEND_ABI_DIR, { recursive: true });
  console.log('✓ Created directory:', BACKEND_ABI_DIR);
}

let successCount = 0;
let errorCount = 0;

CONTRACTS.forEach((contractName) => {
  try {
    const artifactPath = path.join(
      ARTIFACTS_DIR,
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.error(`✗ ${contractName}: Artifact not found at ${artifactPath}`);
      errorCount++;
      return;
    }

    const artifact = require(artifactPath);
    const abi = artifact.abi;

    // Save ABI to backend
    const abiPath = path.join(BACKEND_ABI_DIR, `${contractName}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

    console.log(`✓ ${contractName}: ABI copied successfully`);
    successCount++;
  } catch (error) {
    console.error(`✗ ${contractName}: Error -`, error.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✓ Success: ${successCount}`);
console.log(`✗ Failed: ${errorCount}`);
console.log('='.repeat(50) + '\n');

if (errorCount > 0) {
  console.log('⚠️  Some ABIs failed to copy. Make sure to compile contracts first:');
  console.log('   npx hardhat compile\n');
  process.exit(1);
} else {
  console.log('🎉 All ABIs copied successfully!\n');
  process.exit(0);
}
