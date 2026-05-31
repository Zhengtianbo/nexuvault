import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Droplets, ArrowDownLeft, ArrowUpRight, Gift, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useVaultContract } from '@/hooks/useVault'

const typeIcons: Record<string, any> = {
  faucet: Droplets,
  approve: CheckCircle,
  stake: ArrowDownLeft,
  unstake: ArrowUpRight,
  harvest: Gift,
}

const typeLabels: Record<string, string> = {
  faucet: 'Faucet',
  approve: 'Approve',
  stake: 'Stake',
  unstake: 'Unstake',
  harvest: 'Harvest',
}

const typeColors: Record<string, string> = {
  faucet: 'text-blue-400',
  approve: 'text-slate-400',
  stake: 'text-emerald-400',
  unstake: 'text-red-400',
  harvest: 'text-amber-400',
}

export default function TxHistory() {
  const { txHistory } = useVaultContract()
  const [expanded, setExpanded] = useState(false)

  const displayList = expanded ? txHistory : txHistory.slice(0, 5)

  if (txHistory.length === 0) return null

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl bg-card-dark border border-[#272A33] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#272A33]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B15] flex items-center justify-center">
                <Clock className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Activity</h3>
                <p className="text-xs text-slate-500">{txHistory.length} transaction{txHistory.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#272A33]">
            <AnimatePresence>
              {displayList.map((tx, i) => {
                const Icon = typeIcons[tx.type] || Clock
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-[#1A1D26] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-[#1A1D26] flex items-center justify-center ${typeColors[tx.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{typeLabels[tx.type]}</span>
                        <span className="text-xs text-slate-500">{tx.symbol}</span>
                      </div>
                      <div className="text-xs text-slate-600 mono">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-white mono">
                      {tx.amount}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {txHistory.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-3 text-xs text-slate-500 hover:text-gold transition-colors border-t border-[#272A33]"
            >
              {expanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show All ({txHistory.length}) <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </motion.div>
      </div>
    </section>
  )
}
