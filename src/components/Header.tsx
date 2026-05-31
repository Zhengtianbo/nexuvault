import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass glass-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-gold opacity-20 blur-sm" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0A0B0D]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gradient-gold leading-tight">NexusVault</span>
              <span className="text-[10px] text-slate-500 leading-tight tracking-wider uppercase">DeFi Yield Aggregator</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1D26] border border-[#272A33]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">Hardhat Local</span>
            </div>
          </div>

          <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
        </div>
      </div>
    </motion.header>
  )
}
