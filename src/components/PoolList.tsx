import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { useVaultContract } from '@/hooks/useVault'
import PoolCard from './PoolCard'

export default function PoolList() {
  const { pools, userPoolInfos } = useVaultContract()

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B15] flex items-center justify-center">
              <Database className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Yield Pools</h2>
              <p className="text-xs text-slate-500">Stake tokens to earn NEX rewards</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">{pools.length} pool{pools.length !== 1 ? 's' : ''} available</div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pools.map((pool, i) => (
            <PoolCard key={pool.pid} pool={pool} userInfo={userPoolInfos.find(u => u.pid === pool.pid)} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
