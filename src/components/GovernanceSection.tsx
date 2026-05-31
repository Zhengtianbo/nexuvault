import { useState } from 'react'
import { motion } from 'framer-motion'
import { Vote, TrendingUp } from 'lucide-react'
import { useVaultContract } from '@/hooks/useVault'

export default function GovernanceSection() {
  const { nexBalanceNum, isConnected } = useVaultContract()

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          <span className="text-white">Protocol </span>
          <span className="text-gradient-gold">Governance</span>
        </h2>
        {isConnected ? (
          <div className="p-4 rounded-xl bg-card-dark border border-[#272A33]">
            <p className="text-slate-400">Your NEX Balance: <span className="text-gold mono">{nexBalanceNum.toFixed(4)}</span></p>
            <p className="text-xs text-slate-500 mt-2">Hold NEX to boost yield and vote on proposals</p>
          </div>
        ) : (
          <p className="text-slate-500">Connect wallet to view governance</p>
        )}
      </div>
    </section>
  )
}