import { useAccount } from 'wagmi'
import { TrendingUp, Wallet, PiggyBank, Layers, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useVaultContract } from '@/hooks/useVault'

export default function HeroSection() {
  const { isConnected } = useAccount()
  const { totalTvl, totalPendingReward, totalStakedValue, poolLength, useMock, isHardhat } = useVaultContract()

  const stats = [
    { label: 'Total Value Locked', value: totalTvl, icon: Layers, prefix: '$', suffix: '', decimals: 0 },
    { label: 'Active Pools', value: poolLength, icon: PiggyBank, prefix: '', suffix: '', decimals: 0 },
    ...(isConnected && !useMock ? [
      { label: 'Your Staked Value', value: totalStakedValue, icon: Wallet, prefix: '$', suffix: '', decimals: 2 },
      { label: 'Pending Rewards', value: Number(totalPendingReward) / 1e18, icon: TrendingUp, prefix: '', suffix: ' NEX', decimals: 4 },
    ] : []),
  ]

  return (
    <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
            <span className="text-white">Smart Yield</span>
            <br />
            <span className="text-gradient-gold">Aggregation</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Maximize your crypto returns with automated DeFi yield optimization.
            Stake assets, earn NEX rewards, and watch your portfolio grow.
          </p>
        </motion.div>

        {useMock && isConnected && !isHardhat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-sm text-amber-300">
                <span className="font-medium">Demo Mode:</span> Connect to <span className="font-mono text-amber-200">Hardhat Localhost (31337)</span> for full on-chain functionality. Showing simulated data.
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <div className="relative p-5 rounded-xl bg-card-dark border border-[#272A33] hover:border-[#F59E0B33] transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B15] flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-white mono">
                  {stat.prefix}
                  <CountUp end={stat.value} duration={2} separator="," decimals={stat.decimals} />
                  {stat.suffix}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {!isConnected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F59E0B10] border border-[#F59E0B30]">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-sm text-gold">Connect your wallet to start staking and earning rewards</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
