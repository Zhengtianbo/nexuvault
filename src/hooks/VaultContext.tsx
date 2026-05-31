import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { formatUnits, parseUnits, type Address } from 'viem'
import { useReadContracts } from 'wagmi'
import type { PoolInfo, UserPoolInfo, TransactionState } from '@/types'
import { CONTRACTS } from '@/config/contracts'
import NexusVaultAbi from '@/abi/NexusVault.json'
import Erc20Abi from '@/abi/ERC20.json'

const typedNexusVaultAbi = NexusVaultAbi as readonly unknown[] as any
const typedErc20Abi = Erc20Abi as readonly unknown[] as any
export function getBoostTier(nexBalance: number) {
  return { multiplier: 1.0, label: 'None' }
}
export interface TxRecord {
  id: string
  type: 'faucet' | 'approve' | 'stake' | 'unstake' | 'harvest'
  symbol: string
  amount: string
  timestamp: number
  status: 'success' | 'pending'
}

const MOCK_POOLS: PoolInfo[] = [
  { pid: 0, lpToken: CONTRACTS.tokens[0].address, allocPoint: 300n, lastRewardBlock: 0n, accNexPerShare: 0n, totalStaked: parseUnits('450', 18), tokenName: 'Wrapped Ether', tokenSymbol: 'WETH', tokenDecimals: 18, apr: 18.5 },
  { pid: 1, lpToken: CONTRACTS.tokens[1].address, allocPoint: 400n, lastRewardBlock: 0n, accNexPerShare: 0n, totalStaked: parseUnits('125000', 6), tokenName: 'USD Coin', tokenSymbol: 'USDC', tokenDecimals: 6, apr: 12.8 },
  { pid: 2, lpToken: CONTRACTS.tokens[2].address, allocPoint: 200n, lastRewardBlock: 0n, accNexPerShare: 0n, totalStaked: parseUnits('78000', 18), tokenName: 'Dai Stablecoin', tokenSymbol: 'DAI', tokenDecimals: 18, apr: 11.2 },
  { pid: 3, lpToken: CONTRACTS.tokens[3].address, allocPoint: 100n, lastRewardBlock: 0n, accNexPerShare: 0n, totalStaked: parseUnits('3.5', 8), tokenName: 'Wrapped Bitcoin', tokenSymbol: 'WBTC', tokenDecimals: 8, apr: 8.4 },
]

interface VaultContextType {
  pools: PoolInfo[]
  userPoolInfos: UserPoolInfo[]
  totalTvl: number
  totalPendingReward: bigint
  totalStakedValue: number
  poolLength: number
  isConnected: boolean
  userAddress: Address | undefined
  txState: TransactionState
  useMock: boolean
  isHardhat: boolean
  txHistory: TxRecord[]
  approveToken: (tokenAddress: Address, amount: bigint) => Promise<string | undefined>
  deposit: (pid: number, amount: bigint) => Promise<string | undefined>
  withdraw: (pid: number, amount: bigint) => Promise<string | undefined>
  harvest: (pid: number) => Promise<string | undefined>
  faucet: (tokenAddress: Address) => Promise<string | undefined>
  resetTxState: () => void
}

const VaultContext = createContext<VaultContextType | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const { address: userAddress, isConnected, chainId } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' })
  const [useMock, setUseMock] = useState(true)
  const [txHistory, setTxHistory] = useState<TxRecord[]>([])

  // Auto-reset txState to idle 3s after success/error
  useEffect(() => {
    if (txState.status === 'success' || txState.status === 'error') {
      const timer = setTimeout(() => setTxState({ status: 'idle' }), 3000)
      return () => clearTimeout(timer)
    }
  }, [txState.status])

  const [mockBalances, setMockBalances] = useState<Record<string, number>>({ WETH: 10, USDC: 10000, DAI: 10000, WBTC: 0.5 })
  const [mockStaked, setMockStaked] = useState<Record<string, number>>({ WETH: 0, USDC: 0, DAI: 0, WBTC: 0 })
  const [mockRewards, setMockRewards] = useState<Record<string, number>>({ WETH: 0, USDC: 0, DAI: 0, WBTC: 0 })
  const [mockApproved, setMockApproved] = useState<Record<string, boolean>>({ WETH: true, USDC: true, DAI: true, WBTC: true })
  const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { data: nexBalanceRaw } = useReadContract({
    address: CONTRACTS.nexToken, abi: typedErc20Abi, functionName: 'balanceOf', args: [userAddress],
    query: { enabled: isConnected && !!userAddress && chainId === 31337, refetchInterval: 5000 },
  })
  const nexBalanceNum = useMock ? 0 : Number(formatUnits((nexBalanceRaw as bigint) || 0n, 18))
  const isHardhat = chainId === 31337

  useEffect(() => { setUseMock(!isConnected || !isHardhat) }, [isConnected, isHardhat])

  useEffect(() => {
    if (useMock) {
      rewardTimerRef.current = setInterval(() => {
        setMockRewards(prev => {
          const next = { ...prev }
          MOCK_POOLS.forEach(pool => {
            const staked = mockStaked[pool.tokenSymbol] || 0
            if (staked > 0) {
              const apr = pool.apr / 100
              const secondsPerYear = 365 * 24 * 3600
              const rewardPerSecond = (staked * apr) / secondsPerYear
              next[pool.tokenSymbol] = (next[pool.tokenSymbol] || 0) + rewardPerSecond * 3
            }
          })
          return next
        })
      }, 3000)
    }
    return () => { if (rewardTimerRef.current) clearInterval(rewardTimerRef.current) }
  }, [useMock, mockStaked])

  const { data: poolLength } = useReadContract({
    address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'poolLength',
    query: { enabled: isConnected && isHardhat },
  })
  const { data: nexPerBlock } = useReadContract({
    address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'nexPerBlock',
    query: { enabled: isConnected && isHardhat },
  })
  const { data: totalAllocPoint } = useReadContract({
    address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'totalAllocPoint',
    query: { enabled: isConnected && isHardhat },
  })

  const poolCalls = Array.from({ length: Number(poolLength || 0) }, (_, i) => ({
    address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'poolInfo', args: [i],
  }))
  const { data: poolsRaw } = useReadContracts({
    contracts: poolCalls, query: { enabled: isConnected && isHardhat && Number(poolLength || 0) > 0 },
  })

  const balanceCalls = CONTRACTS.tokens.map(t => ({
    address: t.address, abi: typedErc20Abi, functionName: 'balanceOf', args: [userAddress],
  }))
  const { data: tokenBalances, refetch: refetchBalances } = useReadContracts({
    contracts: balanceCalls, query: { enabled: isConnected && !!userAddress && isHardhat, refetchInterval: 5000 },
  })

  const allowanceCalls = CONTRACTS.tokens.map(t => ({
    address: t.address, abi: typedErc20Abi, functionName: 'allowance', args: [userAddress, CONTRACTS.vault],
  }))
  const { data: tokenAllowances } = useReadContracts({
    contracts: allowanceCalls, query: { enabled: isConnected && !!userAddress && isHardhat, refetchInterval: 5000 },
  })

  const userInfoCalls = Array.from({ length: Number(poolLength || 0) }, (_, i) => ({
    address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'getUserInfo', args: [i, userAddress],
  }))
  const { data: userInfosRaw, refetch: refetchUserInfo } = useReadContracts({
    contracts: userInfoCalls, query: { enabled: isConnected && !!userAddress && isHardhat && Number(poolLength || 0) > 0, refetchInterval: 3000 },
  })

  const chainPools: PoolInfo[] = (poolsRaw || [])
    .filter((p): p is { result: [Address, bigint, bigint, bigint, bigint]; status: 'success' } => p?.status === 'success')
    .map((p, i) => {
      const token = CONTRACTS.tokens[i] || CONTRACTS.tokens[0]
      const totalStaked = Number(formatUnits(p.result[4], token.decimals))
      const apr = totalStaked > 0 && nexPerBlock && totalAllocPoint && p.result[1] > 0
        ? (Number(nexPerBlock) * 7200 * 365 * 0.5 * Number(p.result[1])) / (Number(totalAllocPoint) * totalStaked) * 100
        : 0
      return {
        pid: i, lpToken: p.result[0], allocPoint: p.result[1], lastRewardBlock: p.result[2],
        accNexPerShare: p.result[3], totalStaked: p.result[4],
        tokenName: token.name, tokenSymbol: token.symbol, tokenDecimals: token.decimals, apr: Math.min(apr, 999),
      }
    })

  const pools = useMock ? MOCK_POOLS : chainPools

  const userPoolInfos: UserPoolInfo[] = useMock
    ? CONTRACTS.tokens.map((t, i) => ({
        pid: i,
        stakedAmount: parseUnits(mockStaked[t.symbol].toFixed(t.decimals), t.decimals),
        pendingReward: parseUnits(mockRewards[t.symbol].toFixed(18), 18),
        rewardDebt: 0n,
        tokenBalance: parseUnits(mockBalances[t.symbol].toFixed(t.decimals), t.decimals),
        allowance: mockApproved[t.symbol] ? parseUnits('999999999', t.decimals) : 0n,
      }))
    : (userInfosRaw || [])
        .filter((u): u is { result: [bigint, bigint, bigint]; status: 'success' } => u?.status === 'success')
        .map((u, idx) => ({
          pid: idx, stakedAmount: u.result[0], pendingReward: u.result[1], rewardDebt: u.result[2],
          tokenBalance: tokenBalances?.[idx]?.result as bigint || 0n,
          allowance: tokenAllowances?.[idx]?.result as bigint || 0n,
        }))

  const addTx = (type: TxRecord['type'], symbol: string, amount: string) => {
    setTxHistory(prev => [{ id: Math.random().toString(36).slice(2), type, symbol, amount, timestamp: Date.now(), status: 'success' as const }, ...prev].slice(0, 50))
  }

  const approveToken = useCallback(async (tokenAddress: Address, amount: bigint) => {
    const sym = CONTRACTS.tokens.find(t => t.address === tokenAddress)?.symbol || ''
    if (useMock) { setMockApproved(p => ({ ...p, [sym]: true })); addTx('approve', sym, 'Unlimited'); return '0xmock' }
    setTxState({ status: 'approving' })
    try {
      const hash = await writeContractAsync({ address: tokenAddress, abi: typedErc20Abi, functionName: 'approve', args: [CONTRACTS.vault, amount] })
      setTxState({ status: 'success', hash }); addTx('approve', sym, 'Unlimited')
      return hash
    } catch (err: any) { setTxState({ status: 'error', error: err.message }); throw err }
  }, [useMock, writeContractAsync])

  const deposit = useCallback(async (pid: number, amount: bigint) => {
    const pool = pools[pid]; const sym = pool?.tokenSymbol || ''
    const num = Number(formatUnits(amount, pool?.tokenDecimals || 18))
    if (useMock) {
      setMockBalances(p => ({ ...p, [sym]: Math.max(0, (p[sym] || 0) - num) }))
      setMockStaked(p => ({ ...p, [sym]: (p[sym] || 0) + num }))
      setTxState({ status: 'success', hash: '0xmock' }); addTx('stake', sym, num.toFixed(6))
      return '0xmock'
    }
    setTxState({ status: 'depositing' })
    try {
      const hash = await writeContractAsync({ address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'deposit', args: [pid, amount] })
      await new Promise(r => setTimeout(r, 2000))
      await refetchUserInfo(); await refetchBalances()
      setTxState({ status: 'success', hash }); addTx('stake', sym, num.toFixed(6))
      return hash
    } catch (err: any) { setTxState({ status: 'error', error: err.message }); throw err }
  }, [useMock, writeContractAsync, pools, refetchUserInfo, refetchBalances])

  const withdraw = useCallback(async (pid: number, amount: bigint) => {
    const pool = pools[pid]; const sym = pool?.tokenSymbol || ''
    const num = Number(formatUnits(amount, pool?.tokenDecimals || 18))
    if (useMock) {
      setMockStaked(p => ({ ...p, [sym]: Math.max(0, (p[sym] || 0) - num) }))
      setMockBalances(p => ({ ...p, [sym]: (p[sym] || 0) + num }))
      setTxState({ status: 'success', hash: '0xmock' }); addTx('unstake', sym, num.toFixed(6))
      return '0xmock'
    }
    setTxState({ status: 'withdrawing' })
    try {
      const hash = await writeContractAsync({ address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'withdraw', args: [pid, amount] })
      await new Promise(r => setTimeout(r, 2000))
      await refetchUserInfo(); await refetchBalances()
      setTxState({ status: 'success', hash }); addTx('unstake', sym, num.toFixed(6))
      return hash
    } catch (err: any) { setTxState({ status: 'error', error: err.message }); throw err }
  }, [useMock, writeContractAsync, pools, refetchUserInfo, refetchBalances])

  const harvest = useCallback(async (pid: number) => {
    const pool = pools[pid]; const sym = pool?.tokenSymbol || ''
    if (useMock) {
      const r = mockRewards[sym] || 0
      setMockRewards(p => ({ ...p, [sym]: 0 }))
      setTxState({ status: 'success', hash: '0xmock' }); addTx('harvest', sym, r.toFixed(6))
      return '0xmock'
    }
    setTxState({ status: 'harvesting' })
    try {
      const hash = await writeContractAsync({ address: CONTRACTS.vault, abi: typedNexusVaultAbi, functionName: 'harvest', args: [pid] })
      await new Promise(r => setTimeout(r, 2000))
      await refetchUserInfo()
      setTxState({ status: 'success', hash }); addTx('harvest', sym, 'NEX')
      return hash
    } catch (err: any) { setTxState({ status: 'error', error: err.message }); throw err }
  }, [useMock, writeContractAsync, pools, mockRewards, refetchUserInfo])

  const faucet = useCallback(async (tokenAddress: Address) => {
    const token = CONTRACTS.tokens.find(t => t.address === tokenAddress)
    const sym = token?.symbol || ''; const amount = sym === 'WBTC' ? 0.5 : sym === 'WETH' ? 10 : 10000
    if (useMock) {
      setMockBalances(p => ({ ...p, [sym]: (p[sym] || 0) + amount }))
      addTx('faucet', sym, amount.toString())
      return '0xmock'
    }
    try {
      const hash = await writeContractAsync({ address: tokenAddress, abi: typedErc20Abi, functionName: 'faucet' })
      await new Promise(r => setTimeout(r, 2000))
      await refetchBalances(); addTx('faucet', sym, amount.toString())
      return hash
    } catch (err: any) { throw new Error(err.message) }
  }, [useMock, writeContractAsync, refetchBalances])

  const resetTxState = useCallback(() => setTxState({ status: 'idle' }), [])

  const prices: Record<string, number> = { WETH: 3500, USDC: 1, DAI: 1, WBTC: 65000 }
  const totalTvl = pools.reduce((s, p) => s + Number(formatUnits(p.totalStaked, p.tokenDecimals)) * (prices[p.tokenSymbol] || 1), 0)
  const totalPendingReward = userPoolInfos.reduce((s, u) => s + u.pendingReward, 0n)
  const totalStakedValue = userPoolInfos.reduce((s, u, i) => {
    const p = pools[i]; return p ? s + Number(formatUnits(u.stakedAmount, p.tokenDecimals)) * (prices[p.tokenSymbol] || 1) : s
  }, 0)

  return (
    <VaultContext.Provider value={{
      pools, userPoolInfos, totalTvl, totalPendingReward, totalStakedValue,
      poolLength: useMock ? 4 : Number(poolLength || 0),
      isConnected, userAddress, txState, useMock, isHardhat, txHistory, nexBalanceNum,
      approveToken, deposit, withdraw, harvest, faucet, resetTxState, 
    }}>
      {children}
    </VaultContext.Provider>
  )
}

export function useVaultContract() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVaultContract must be used inside VaultProvider')
  return ctx
}
