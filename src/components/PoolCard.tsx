import { useState, useCallback } from 'react'
import { formatUnits, parseUnits, type Address } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight, Gift, Droplets, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import type { PoolInfo, UserPoolInfo } from '@/types'
import { useVaultContract } from '@/hooks/useVault'
import { TOKEN_COLORS } from '@/config/contracts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface PoolCardProps {
  pool: PoolInfo
  userInfo: UserPoolInfo | undefined
  index: number
}

export default function PoolCard({ pool, userInfo, index }: PoolCardProps) {
  const { approveToken, deposit, withdraw, harvest, faucet, txState, resetTxState, useMock } = useVaultContract()
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<'stake' | 'unstake' | 'harvest'>('stake')
  const [amount, setAmount] = useState('')
  const [sliderValue, setSliderValue] = useState([0])
  const [localTx, setLocalTx] = useState<string>('')

  const stakedAmount = userInfo ? Number(formatUnits(userInfo.stakedAmount, pool.tokenDecimals)) : 0
  const pendingReward = userInfo ? Number(formatUnits(userInfo.pendingReward, 18)) : 0
  const tokenBalance = userInfo ? Number(formatUnits(userInfo.tokenBalance, pool.tokenDecimals)) : 0
  const hasAllowance = userInfo ? userInfo.allowance >= parseUnits('1000000000', pool.tokenDecimals) : false
  const hasBalance = tokenBalance > 0
  const hasStake = stakedAmount > 0

  const isProcessing = ['approving', 'depositing', 'withdrawing', 'harvesting'].includes(txState.status)
  const isSuccess = txState.status === 'success'
  const color = TOKEN_COLORS[pool.tokenSymbol] || '#F59E0B'

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
    const max = tab === 'stake' ? tokenBalance : stakedAmount
    const pct = value[0] / 100
    setAmount((max * pct).toFixed(Math.min(pool.tokenDecimals, 6)))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (/^\d*\.?\d*$/.test(val)) {
      setAmount(val)
      const max = tab === 'stake' ? tokenBalance : stakedAmount
      const num = parseFloat(val) || 0
      setSliderValue([max > 0 ? Math.min((num / max) * 100, 100) : 0])
    }
  }

  const handleAction = useCallback(async () => {
    try {
      if (tab === 'stake') {
        // If user already clicked approve and we're showing "Approved! Now Stake",
        // skip the allowance check and go straight to deposit
        const alreadyApproved = localTx === 'approved'
        if (!hasAllowance && !useMock && !alreadyApproved) {
          setLocalTx('approving')
          await approveToken(pool.lpToken as Address, parseUnits('999999999', pool.tokenDecimals))
          setLocalTx('approved')
          resetTxState() // clear 'approving' state so isProcessing becomes false
          return
        }
        const parsed = parseUnits(amount || '0', pool.tokenDecimals)
        if (parsed > 0n) {
          await deposit(pool.pid, parsed)
          setAmount('')
          setSliderValue([0])
          setLocalTx('')
        }
      } else if (tab === 'unstake') {
        const parsed = parseUnits(amount || '0', pool.tokenDecimals)
        if (parsed > 0n) {
          await withdraw(pool.pid, parsed)
          setAmount('')
          setSliderValue([0])
        }
      } else if (tab === 'harvest') {
        await harvest(pool.pid)
      }
    } catch (err) {
      console.error('Action failed:', err)
      setLocalTx('')
    }
  }, [tab, amount, pool, hasAllowance, useMock, localTx, approveToken, deposit, withdraw, harvest, resetTxState])

  const handleFaucet = async () => {
    try { await faucet(pool.lpToken as Address) } catch (err) { console.error(err) }
  }

  const handleClose = () => {
    setIsOpen(false); setAmount(''); setSliderValue([0]); setLocalTx(''); resetTxState()
  }

  const maxForTab = tab === 'stake' ? tokenBalance : stakedAmount
  const canSubmit = !isProcessing && amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxForTab

  return (
    <>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: index * 0.08 }} className="relative group">
        <div
          className={`relative p-5 rounded-xl bg-card-dark border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
            pool.apr > 15 ? 'border-[#F59E0B44] hover:glow-gold' : 'border-[#272A33] hover:border-[#F59E0B33]'
          }`}
          onClick={() => { setIsOpen(true); setTab('stake'); }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: `${color}22`, border: `2px solid ${color}44` }}>
                {pool.tokenSymbol.slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-white">{pool.tokenSymbol}</div>
                <div className="text-xs text-slate-500">{pool.tokenName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">{pool.apr.toFixed(1)}%</span>
              </div>
              <div className="text-[10px] text-slate-500">APR</div>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-lg bg-[#0A0B0D] border border-[#272A33]">
            <div className="text-xs text-slate-500 mb-1">Total Staked</div>
            <div className="text-sm font-semibold text-white mono">
              {Number(formatUnits(pool.totalStaked, pool.tokenDecimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })} {pool.tokenSymbol}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#272A33]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Your Stake</span>
              <span className="text-white mono">{stakedAmount.toFixed(4)} {pool.tokenSymbol}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pending Rewards</span>
              <span className="text-gold mono">{pendingReward.toFixed(4)} NEX</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Balance</span>
              <span className={`mono ${hasBalance ? 'text-slate-300' : 'text-red-400'}`}>
                {tokenBalance.toFixed(4)} {pool.tokenSymbol}
              </span>
            </div>
          </div>

          {pool.apr > 15 && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-gold text-[10px] font-bold text-[#0A0B0D]">
              HIGH YIELD
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-[#12141A] border-[#272A33] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${color}22`, border: `2px solid ${color}44`, color }}>
                {pool.tokenSymbol.slice(0, 2)}
              </div>
              <span>{pool.tokenSymbol} Pool</span>
              <span className="text-emerald-400 text-sm">{pool.apr.toFixed(1)}% APR</span>
            </DialogTitle>
          </DialogHeader>

          {useMock && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300">Demo Mode — simulated transactions</span>
            </div>
          )}

          {!hasBalance && (
            <button onClick={handleFaucet} disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#3B82F615] border border-[#3B82F630] text-blue-400 text-sm hover:bg-[#3B82F625] transition-colors font-medium disabled:opacity-50"
            >
              <Droplets className="w-4 h-4" />
              Get Free {pool.tokenSymbol} — Balance is 0
            </button>
          )}

          <div className="flex gap-1 p-1 rounded-lg bg-[#0A0B0D] border border-[#272A33]">
            {(['stake', 'unstake', 'harvest'] as const).map((t) => (
              <button key={t} onClick={() => { if (!isProcessing) { setTab(t); setAmount(''); setSliderValue([0]); setLocalTx(''); resetTxState() }}}
                className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  tab === t ? 'bg-gradient-gold text-[#0A0B0D]' : 'text-slate-400 hover:text-white'
                } ${(t === 'unstake' && !hasStake) || (t === 'harvest' && pendingReward <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={(t === 'unstake' && !hasStake) || (t === 'harvest' && pendingReward <= 0)}
              >
                {t === 'stake' && <Wallet className="w-3.5 h-3.5 inline mr-1" />}
                {t === 'unstake' && <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />}
                {t === 'harvest' && <Gift className="w-3.5 h-3.5 inline mr-1" />}
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'harvest' ? (
              <motion.div key="harvest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#272A33] text-center">
                  <div className="text-sm text-slate-400 mb-2">Available Rewards</div>
                  <div className="text-3xl font-bold text-gradient-gold mono">{pendingReward.toFixed(6)} NEX</div>
                </div>
                {pendingReward > 0 ? (
                  <Button onClick={handleAction} disabled={isProcessing} className="w-full bg-gradient-gold text-[#0A0B0D] hover:opacity-90 font-semibold h-12">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5 mr-2" />}
                    {isProcessing ? 'Claiming...' : 'Claim Rewards'}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 text-slate-500 text-sm">
                    <AlertTriangle className="w-4 h-4" /> No rewards to claim
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="amount" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Available: {maxForTab.toFixed(6)} {pool.tokenSymbol}</span>
                  <button onClick={() => { if (maxForTab > 0) { setAmount(maxForTab.toString()); setSliderValue([100]) } }} className="text-gold hover:underline font-medium">MAX</button>
                </div>

                <div className="relative">
                  <input type="text" value={amount} onChange={handleAmountChange} placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg bg-[#0A0B0D] border border-[#272A33] text-white text-lg font-semibold mono placeholder:text-slate-600 focus:outline-none focus:border-[#F59E0B66] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">{pool.tokenSymbol}</span>
                </div>

                <Slider value={sliderValue} onValueChange={handleSliderChange} max={100} step={1} className="py-2" />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>

                {!hasBalance && tab === 'stake' ? (
                  <Button onClick={handleFaucet} disabled={isProcessing} className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 font-semibold h-12 disabled:opacity-50">
                    <Droplets className="w-5 h-5 mr-2" /> Get Free {pool.tokenSymbol}
                  </Button>
                ) : localTx === 'approved' ? (
                  <Button onClick={handleAction} disabled={isProcessing} className="w-full bg-gradient-gold text-[#0A0B0D] hover:opacity-90 font-semibold h-12 disabled:opacity-50">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    {isProcessing ? 'Staking...' : 'Approved! Now Stake'}
                  </Button>
                ) : (
                  <Button onClick={handleAction} disabled={!canSubmit || isProcessing} className={`w-full font-semibold h-12 disabled:opacity-50 ${
                    tab === 'stake' ? 'bg-gradient-gold text-[#0A0B0D] hover:opacity-90' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  }`}>
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> :
                      tab === 'stake' && !hasAllowance && !useMock ? <><ArrowDownLeft className="w-5 h-5 mr-2" /> Approve</> :
                      tab === 'stake' ? <><ArrowDownLeft className="w-5 h-5 mr-2" /> Stake</> :
                      <><ArrowUpRight className="w-5 h-5 mr-2" /> Unstake</>}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isSuccess && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2 py-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Transaction Successful!</span>
            </motion.div>
          )}

          {txState.status === 'error' && (
            <div className="flex items-center justify-center gap-2 py-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{txState.error || 'Transaction failed'}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
