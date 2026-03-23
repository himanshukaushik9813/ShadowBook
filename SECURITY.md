# Security Guidelines

## Repository security posture
- This project contains blockchain deployment tooling and wallet integrations.
- Secrets must remain local and never be committed to source control.

## Required secret handling
- Keep secrets only in local environment files:
  - `/Users/himanshukaushik/Desktop/notProject/shadowbook/.env`
  - `/Users/himanshukaushik/Desktop/notProject/shadowbook/frontend/.env.local`
- Commit only example templates:
  - `/Users/himanshukaushik/Desktop/notProject/shadowbook/.env.example`
  - `/Users/himanshukaushik/Desktop/notProject/shadowbook/frontend/.env.local.example`

## Pre-publish checklist
1. Verify `.env` and `.env.local` are empty of real keys.
2. Confirm `.gitignore` blocks env files, keys, and build artifacts.
3. Build locally and confirm app behavior:
   - `npm run compile`
   - `npm --prefix frontend run build`
4. Re-check deployment files and remove accidental local overrides.

## If a key is exposed
1. Rotate the compromised private key immediately.
2. Revoke/rotate impacted RPC/API credentials.
3. Replace local secrets and redeploy from a safe account.
4. Audit recent commits and CI logs for leaks before publishing.
