import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { hardhat } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'NexusVault',
  projectId: 'nexusvault_defi_yield_aggregator_2024',
  chains: [hardhat],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})
