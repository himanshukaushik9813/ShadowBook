# ShadowBook - Encrypted Orderflow Layer

ShadowBook is a Web3 encrypted trading system built with CoFHE/FHE primitives, Solidity smart contracts, and a production-style Next.js frontend.

## Proprietary Usage Warning
This project is proprietary. Source code and product design are provided for authorized evaluation and approved collaboration only.

- No unauthorized reuse, redistribution, or derivative commercialization.
- No reverse engineering for competitive replication.
- See [LICENSE](/Users/himanshukaushik/Desktop/notProject/shadowbook/LICENSE) for full terms.

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
npm run deploy:sepolia
# or
npm run deploy:arb-sepolia
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
4. Review [SECURITY.md](/Users/himanshukaushik/Desktop/notProject/shadowbook/SECURITY.md) before pushing.

## Note on Intellectual Property
Implementation is documented for maintainability and review, but this repository is not released as open-source software.
