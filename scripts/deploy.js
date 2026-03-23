const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const ShadowBook = await hre.ethers.getContractFactory('ShadowBook');
  const shadowBook = await ShadowBook.deploy();
  await shadowBook.waitForDeployment();

  const deployedAddress = await shadowBook.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  const deployment = {
    address: deployedAddress,
    chainId: Number(network.chainId),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const frontendDeploymentPath = path.join(
    __dirname,
    '..',
    'frontend',
    'constants',
    'deployment.json'
  );

  fs.writeFileSync(frontendDeploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('ShadowBook deployed successfully');
  console.log(`Network: ${deployment.network} (${deployment.chainId})`);
  console.log(`Address: ${deployment.address}`);
  console.log(`Frontend deployment file updated: ${frontendDeploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
