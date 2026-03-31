require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const accounts = privateKey ? [privateKey] : [];
const heliumRpcUrl = process.env.FHENIX_RPC_URL || 'https://api.helium.fhenix.zone';

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
    fhenix_helium: {
      url: heliumRpcUrl,
      chainId: 8008135,
      accounts,
    },
  },
};
