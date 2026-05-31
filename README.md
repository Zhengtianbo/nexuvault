# NexusVault - DeFi Yield Aggregator

A production-grade decentralized finance (DeFi) yield aggregation platform with full on-chain functionality.

**Live Demo:** https://vcvo7ibvpy2uy.ok.kimi.link

## Overview

NexusVault is a complete full-stack Web3 application demonstrating:
- **Solidity smart contracts** (OpenZeppelin, ReentrancyGuard, Pausable)
- **Multi-pool yield farming** with real-time reward calculation
- **MetaMask wallet integration** via RainbowKit + Wagmi
- **React/TypeScript frontend** with Tailwind CSS
- **Hardhat local blockchain** for testing

## Project Structure

```
├── src/
│   ├── contracts/          # Solidity source code
│   │   ├── NexusVault.sol  # Main yield farming contract
│   │   ├── NexusToken.sol  # ERC-20 governance token
│   │   └── MockERC20.sol   # Test ERC-20 tokens with faucet
│   ├── components/         # React UI components
│   ├── hooks/              # Web3 interaction hooks
│   ├── abi/                # Contract ABIs
│   └── config/             # Wagmi & contract configs
├── hardhat/                # Hardhat blockchain environment
│   ├── contracts/          # Contracts (symlinked from src)
│   ├── scripts/deploy.js   # Deployment script
│   ├── test/               # Contract test suite
│   └── hardhat.config.js   # Network configuration
└── dist/                   # Production build output
```

## Quick Start (Make It Work Locally)

### Prerequisites

- Node.js 18+
- MetaMask browser extension

### Step 1: Start Hardhat Local Blockchain

```bash
cd hardhat
npm install
npx hardhat node
```

This starts a local Ethereum blockchain on `http://127.0.0.1:8545`.

**Default accounts (each with 10,000 ETH):**
- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (deployer)
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (test user)

### Step 2: Deploy Contracts

In a new terminal:

```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```

This deploys:
- `NexusVault` - Main farming contract
- `NexusToken` (NEX) - Reward token
- 4 Mock ERC20 tokens (WETH, USDC, DAI, WBTC)
- Creates 4 yield pools with different allocation points
- Sends test tokens to the deployer

### Step 3: Add Hardhat Network to MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Fill in:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
3. Click Save

### Step 4: Import Test Account

1. In MetaMask, click the account icon → Import Account
2. Paste this private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. You should see ~10,000 ETH balance

### Step 5: Run Frontend

```bash
# In project root (not hardhat/)
npm install
npm run dev
```

Open http://localhost:5173

### Step 6: Use the DApp

1. Click "Connect Wallet" → Select MetaMask
2. Ensure you're on "Hardhat Local" network
3. Click any pool card (WETH, USDC, DAI, WBTC)
4. Click "Get Free [Token] (Faucet)" to receive test tokens
5. Enter amount → Click "Approve" (first time)
6. Click "Stake" to deposit
7. Wait a few blocks (or click through)
8. Click "Harvest" to claim NEX rewards

## Smart Contract Features

### NexusVault.sol
- Multi-pool yield farming with per-block reward calculation
- Deposit/withdraw/harvest functions
- Emergency withdraw with 1% fee
- ReentrancyGuard on all fund operations
- Pausable for emergency stops
- Admin functions: add pools, update allocation, recover tokens

### Security
- ReentrancyGuard (OpenZeppelin)
- SafeERC20 for token transfers
- Access control via Ownable
- Emergency pause mechanism
- Token recovery (cannot recover pool tokens)

### NexusToken.sol
- ERC-20 with controlled minting
- Minter role for Vault contract
- Max supply cap: 10,000,000 NEX
- Burn functionality

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity ^0.8.19, OpenZeppelin |
| Blockchain | Hardhat, Ethers.js v6 |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | RainbowKit, Wagmi, viem |
| Charts | Recharts |
| Animation | Framer Motion |

## Testing

```bash
cd hardhat
npx hardhat test
```

Tests cover:
- Pool creation and configuration
- Deposit and reward accrual
- Harvest (claim rewards)
- Withdrawal (full amount returned)
- Emergency withdraw (with fee deduction)
- Pause/unpause functionality

## Deployment Addresses (Hardhat Local)

After running `deploy.js`, check `hardhat/deployments/localhost.json` for addresses.

Default addresses (Hardhat deterministic):
- Vault: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- NEX Token: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- WETH: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- USDC: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- DAI: `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`
- WBTC: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

## Demo Mode

When not connected to Hardhat localhost, the UI shows **simulated data** with realistic APR values and TVL amounts so you can explore the interface without a local blockchain.

Connect to Hardhat Local (Step 3 above) to enable **full on-chain functionality**.

## Hiring Relevance

This project demonstrates expertise in:
- **Solidity** smart contract development
- **DeFi protocol design** (yield farming, reward calculation)
- **EVM** network integration
- **Web3 wallet** integration (MetaMask, WalletConnect, Coinbase)
- **React/TypeScript** frontend development
- **Smart contract security** (ReentrancyGuard, Pausable, SafeERC20)
- **Hardhat** development environment
