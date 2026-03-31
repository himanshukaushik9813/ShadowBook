const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

const ONE_ETH = 10n ** 18n;

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const ShadowUSDC = await hre.ethers.getContractFactory('ShadowUSDC');
  const shadowUSDC = await ShadowUSDC.deploy();
  await shadowUSDC.waitForDeployment();

  const ShadowETH = await hre.ethers.getContractFactory('ShadowETH');
  const shadowETH = await ShadowETH.deploy();
  await shadowETH.waitForDeployment();

  const ShadowBook = await hre.ethers.getContractFactory('ShadowBook');
  const shadowBook = await ShadowBook.deploy(
    await shadowETH.getAddress(),
    await shadowUSDC.getAddress()
  );
  await shadowBook.waitForDeployment();

  await (await shadowUSDC.mint(deployer.address, 1_000_000n * ONE_ETH)).wait();
  await (await shadowETH.mint(deployer.address, 1_000n * ONE_ETH)).wait();

  const network = await hre.ethers.provider.getNetwork();
  const deployment = {
    contractAddress: await shadowBook.getAddress(),
    shadowUSDCAddress: await shadowUSDC.getAddress(),
    shadowETHAddress: await shadowETH.getAddress(),
    chainId: Number(network.chainId),
  };

  const frontendDeploymentPath = path.join(
    __dirname,
    '..',
    'frontend',
    'constants',
    'deployment.json'
  );

  fs.writeFileSync(frontendDeploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('ShadowBook deployment complete');
  console.log(`Network: ${hre.network.name} (${deployment.chainId})`);
  console.log(`ShadowBook: ${deployment.contractAddress}`);
  console.log(`ShadowUSDC: ${deployment.shadowUSDCAddress}`);
  console.log(`ShadowETH: ${deployment.shadowETHAddress}`);
  console.log(`Frontend deployment file updated: ${frontendDeploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
