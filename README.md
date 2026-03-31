# ShadowBook - Encrypted Orderflow Layer

ShadowBook is a Web3 encrypted trading system built with CoFHE/FHE primitives, Solidity smart contracts, and a production-style Next.js frontend.

## What this demo does
ShadowBook is a privacy-preserving DEX prototype on Fhenix Helium.

What is real:
- Orders are encrypted in the browser using the Fhenix CoFHE public key
- Encrypted values are stored and compared on-chain without decryption
- Token escrow is real — ShadowUSDC and ShadowETH are locked on order placement and released on fill or cancellation
- Settlement is real — ERC-20 transfers happen on-chain at match time
- Only the order owner can decrypt their own execution results

What is simulated:
- ShadowUSDC and ShadowETH are testnet tokens with a public mint function
- GhostFi credit scoring and ZK proofs are server-side simulations
- The matching engine is O(n) with a depth cap — not production grade

## Proprietary Usage Warning
This project is proprietary. Source code and product design are provided for authorized evaluation and approved collaboration only.

- No unauthorized reuse, redistribution, or derivative commercialization.
- No reverse engineering for competitive replication.
- See [LICENSE](./LICENSE) for full terms.

## What This Repository Contains
- Encrypted orderflow smart contract (`contracts/ShadowBook.sol`)
- Frontend app with wallet + CoFHE integration (`frontend/`)
- Deployment and bootstrap scripts (`scripts/`)
- API routes for privacy-finance assistant features (`frontend/pages/api/`)

## Clean Project Layout
```text
shadowbook/
├── contracts/
├── frontend/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── constants/
│   └── styles/
├── scripts/
├── .env.example
├── hardhat.config.js
├── LICENSE
├── README.md
└── SECURITY.md
```

Generated folders (`node_modules`, `artifacts`, `cache`, `frontend/.next`) are local-only and gitignored.

## Secure Setup
From project root:

```bash
npm install
npm --prefix frontend install
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
```

Fill local env files with your own values. Do not commit real credentials.

## Build and Deploy
Compile:

```bash
npm run compile
```

Deploy:

```bash
npm run deploy:helium
```

Seed the book with demo orders:

```bash
npm run seed:helium
```

Run frontend:

```bash
npm run frontend:dev
```

## Secure GitHub Publishing Checklist
1. Confirm `.env` and `frontend/.env.local` contain no live secrets.
2. Validate `.gitignore` is active for all secret and generated files.
3. Run local verification:
   - `npm run compile`
   - `npm --prefix frontend run build`
   - `npm run deploy:helium`
4. Review [SECURITY.md](./SECURITY.md) before pushing.

## Note on Intellectual Property
Implementation is documented for maintainability and review, but this repository is not released as open-source software.
