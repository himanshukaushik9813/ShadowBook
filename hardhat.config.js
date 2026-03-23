require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const accounts = privateKey ? [privateKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.25',
    settings: {
      evmVersion: 'cancun',
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
      chainId: 11155111,
      accounts,
    },
    arbitrumSepolia: {
      url:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia.publicnode.com',
      chainId: 421614,
      accounts,
    },
  },
};
