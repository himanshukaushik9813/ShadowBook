const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const hre = require('hardhat');

const frontendRequire = createRequire(path.join(__dirname, '..', 'frontend', 'package.json'));
const { Encryptable } = frontendRequire('@cofhe/sdk');
const { createCofheClient, createCofheConfig } = frontendRequire('@cofhe/sdk/node');
const { createPublicClient, createWalletClient, defineChain, http } = frontendRequire('viem');
const { privateKeyToAccount } = frontendRequire('viem/accounts');

const SCALING_FACTOR = 1_000_000n;
const TOKEN_MULTIPLIER = 10n ** 12n;
const ONE_TOKEN = 10n ** 18n;
const HELIUM_RPC_URL = process.env.FHENIX_RPC_URL || 'https://api.helium.fhenix.zone';

const heliumCofheChain = {
  id: 8008135,
  name: 'Fhenix Helium',
  network: 'helium',
  coFheUrl: 'https://testnet-cofhe.fhenix.zone',
  verifierUrl: 'https://testnet-cofhe-vrf.fhenix.zone',
  thresholdNetworkUrl: 'https://testnet-cofhe-tn.fhenix.zone',
  environment: 'TESTNET',
};

const heliumViemChain = defineChain({
  id: 8008135,
  name: 'Fhenix Helium',
  nativeCurrency: { name: 'tFHE', symbol: 'tFHE', decimals: 18 },
  rpcUrls: {
    default: { http: [HELIUM_RPC_URL] },
    public: { http: [HELIUM_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.helium.fhenix.zone' },
  },
  testnet: true,
});

function scalePrice(price) {
  return BigInt(Math.round(price * 1e6));
}

function scaleAmount(amount) {
  return BigInt(Math.round(amount * 1e6));
}

function quoteEscrow(priceScaled, amountScaled) {
  return ((priceScaled * amountScaled) / SCALING_FACTOR) * TOKEN_MULTIPLIER;
}

function baseEscrow(amountScaled) {
  return amountScaled * TOKEN_MULTIPLIER;
}

async function encryptOrder(cofheClient, account, chainId, priceScaled, amountScaled) {
  const [encryptedPrice, encryptedAmount] = await cofheClient
    .encryptInputs([
      Encryptable.uint32(priceScaled),
      Encryptable.uint32(amountScaled),
    ])
    .setAccount(account)
    .setChainId(chainId)
    .execute();

  return {
    encryptedPrice: {
      ctHash: encryptedPrice.ctHash,
      securityZone: Number(encryptedPrice.securityZone),
      utype: Number(encryptedPrice.utype),
      signature: encryptedPrice.signature,
    },
    encryptedAmount: {
      ctHash: encryptedAmount.ctHash,
      securityZone: Number(encryptedAmount.securityZone),
      utype: Number(encryptedAmount.utype),
      signature: encryptedAmount.signature,
    },
  };
}

async function main() {
  const deploymentPath = path.join(__dirname, '..', 'frontend', 'constants', 'deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('Missing frontend/constants/deployment.json. Run deploy.js first.');
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const [deployer] = await hre.ethers.getSigners();

  const shadowUSDC = await hre.ethers.getContractAt('ShadowUSDC', deployment.shadowUSDCAddress);
  const shadowETH = await hre.ethers.getContractAt('ShadowETH', deployment.shadowETHAddress);
  const shadowBook = await hre.ethers.getContractAt('ShadowBook', deployment.contractAddress);

  for (const wallet of [process.env.SEED_WALLET_1, process.env.SEED_WALLET_2]) {
    if (wallet) {
      await (await shadowUSDC.mint(wallet, 50_000n * ONE_TOKEN)).wait();
      await (await shadowETH.mint(wallet, 50n * ONE_TOKEN)).wait();
      console.log(`Funded demo wallet ${wallet}`);
    }
  }

  await (await shadowUSDC.mint(deployer.address, 250_000n * ONE_TOKEN)).wait();
  await (await shadowETH.mint(deployer.address, 250n * ONE_TOKEN)).wait();
  await (await shadowUSDC.approve(deployment.contractAddress, hre.ethers.MaxUint256)).wait();
  await (await shadowETH.approve(deployment.contractAddress, hre.ethers.MaxUint256)).wait();

  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY is required for CoFHE seeding.');
  }

  const publicClient = createPublicClient({
    chain: heliumViemChain,
    transport: http(HELIUM_RPC_URL),
  });
  const walletClient = createWalletClient({
    account: privateKeyToAccount(deployerKey.startsWith('0x') ? deployerKey : `0x${deployerKey}`),
    chain: heliumViemChain,
    transport: http(HELIUM_RPC_URL),
  });

  const cofheClient = createCofheClient(
    createCofheConfig({
      supportedChains: [heliumCofheChain],
    })
  );
  await cofheClient.connect(publicClient, walletClient);

  const seedOrders = [
    { price: 1800, amount: 0.8, isBuy: true },
    { price: 1750, amount: 0.45, isBuy: true },
    { price: 1820, amount: 0.65, isBuy: false },
    { price: 1900, amount: 0.4, isBuy: false },
    { price: 1790, amount: 0.25, isBuy: false },
  ];

  for (const order of seedOrders) {
    const priceScaled = scalePrice(order.price);
    const amountScaled = scaleAmount(order.amount);
    const { encryptedPrice, encryptedAmount } = await encryptOrder(
      cofheClient,
      deployer.address,
      deployment.chainId,
      priceScaled,
      amountScaled
    );

    const escrowAmount = order.isBuy
      ? quoteEscrow(priceScaled, amountScaled)
      : baseEscrow(amountScaled);

    const tx = await shadowBook.placeOrder(
      encryptedPrice,
      encryptedAmount,
      order.isBuy,
      escrowAmount
    );
    await tx.wait();

    console.log(
      `Seeded ${order.isBuy ? 'buy' : 'sell'} order: ${order.amount} ETH @ ${order.price} USDC/ETH`
    );
  }

  console.log('Seed complete. Demo orders were placed from the deployer account.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
