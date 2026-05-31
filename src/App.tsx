import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import PoolList from '@/components/PoolList'
import GovernanceSection from '@/components/GovernanceSection'
import ContractShowcase from '@/components/ContractShowcase'
import TxHistory from '@/components/TxHistory'
import Footer from '@/components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F59E0B] rounded-full opacity-[0.03] blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F59E0B] rounded-full opacity-[0.02] blur-[128px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10">
        <Header />
        <main>
          <HeroSection />
          <PoolList />
          <GovernanceSection />
          <ContractShowcase />
          <TxHistory />
        </main>
        <Footer />
      </div>
    </div>
  )
}
