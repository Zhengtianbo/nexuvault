export interface PoolInfo {
  pid: number
  lpToken: string
  allocPoint: bigint
  lastRewardBlock: bigint
  accNexPerShare: bigint
  totalStaked: bigint
  tokenName: string
  tokenSymbol: string
  tokenDecimals: number
  apr: number
}

export interface UserPoolInfo {
  pid: number
  stakedAmount: bigint
  pendingReward: bigint
  rewardDebt: bigint
  tokenBalance: bigint
  allowance: bigint
}

export interface VaultStats {
  totalTvl: number
  totalPools: number
  nexPerBlock: bigint
  totalAllocPoint: bigint
}

export interface TokenConfig {
  address: string
  name: string
  symbol: string
  decimals: number
  icon: string
  color: string
}

export interface TransactionState {
  status: 'idle' | 'approving' | 'depositing' | 'withdrawing' | 'harvesting' | 'success' | 'error'
  hash?: string
  error?: string
}
