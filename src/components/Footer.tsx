import { Shield, Github, ExternalLink, BookOpen, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#272A33] bg-[#0A0B0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#0A0B0D]" />
              </div>
              <span className="text-lg font-bold text-gradient-gold">NexusVault</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              A decentralized yield aggregation platform built to demonstrate
              expertise in Solidity, DeFi protocols, and Web3 development.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Tech Stack</h3>
            <div className="space-y-2">
              {[
                { icon: BookOpen, label: 'Solidity ^0.8.19 + OpenZeppelin' },
                { icon: Github, label: 'Hardhat + Ethers.js v6' },
                { icon: ExternalLink, label: 'React 18 + TypeScript' },
                { icon: Shield, label: 'RainbowKit + Wagmi + viem' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500">
                  <item.icon className="w-3.5 h-3.5 text-slate-600" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Key Features</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p>Multi-pool yield farming</p>
              <p>Real-time APR calculation</p>
              <p>ReentrancyGuard protection</p>
              <p>Emergency pause & withdraw</p>
              <p>ERC-20 token recovery</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-[#272A33] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Built for Web3 developer recruitment assessment
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            Crafted with <Heart className="w-3 h-3 text-red-500" /> using React, TypeScript & Solidity
          </p>
        </div>
      </div>
    </footer>
  )
}
