import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileCode, Shield, Lock, Zap, Eye, Copy, CheckCircle } from 'lucide-react'

const contractFiles = [
  {
    name: 'NexusVault.sol',
    icon: Zap,
    description: 'Core yield farming contract with multi-pool support',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract NexusVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accNexPerShare;
        uint256 totalStaked;
    }

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    NexusToken public nexToken;
    uint256 public nexPerBlock;
    uint256 public totalAllocPoint;
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    function deposit(uint256 _pid, uint256 _amount)
        external nonReentrant whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);

        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accNexPerShare)
                / 1e12 - user.rewardDebt;
            if (pending > 0) safeNexTransfer(msg.sender, pending);
        }

        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        user.amount += _amount;
        pool.totalStaked += _amount;
        user.rewardDebt = (user.amount * pool.accNexPerShare) / 1e12;

        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount)
        external nonReentrant whenNotPaused { /* ... */ }

    function emergencyWithdraw(uint256 _pid)
        external nonReentrant { /* ... */ }
}`,
  },
  {
    name: 'NexusToken.sol',
    icon: FileCode,
    description: 'ERC-20 governance token with minting controls',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NexusToken is ERC20, Ownable {
    mapping(address => bool) public minters;
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10 ** 18;
    uint256 public totalMinted;

    modifier onlyMinter() {
        require(minters[msg.sender], "Not a minter");
        _;
    }

    function mint(address _to, uint256 _amount)
        external onlyMinter {
        require(totalMinted + _amount <= MAX_SUPPLY,
            "Max supply exceeded");
        totalMinted += _amount;
        _mint(_to, _amount);
    }

    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
        totalMinted -= _amount;
    }
}`,
  },
  {
    name: 'Security Features',
    icon: Shield,
    description: 'Comprehensive security mechanisms',
    code: `// Security Mechanisms:

// 1. ReentrancyGuard
function deposit(uint256 _pid, uint256 _amount)
    external nonReentrant whenNotPaused { }

// 2. Emergency Pause
function pause() external onlyOwner {
    _pause();
}

// 3. Token Recovery (excludes pool tokens)
function recoverERC20(address _token, uint256 _amount)
    external onlyOwner {
    require(!addedTokens[_token], "Cannot recover pool token");
    IERC20(_token).safeTransfer(owner(), _amount);
}

// 4. Emergency Withdraw Fee (1% default)
uint256 public emergencyWithdrawFee = 100; // 1%
function emergencyWithdraw(uint256 _pid)
    external nonReentrant {
    uint256 feeAmount = (amount * emergencyWithdrawFee) / 10000;
    uint256 receiveAmount = amount - feeAmount;
    // Transfer with fee deduction
}

// 5. Safe NEX Transfer (prevents over-transfer)
function safeNexTransfer(address _to, uint256 _amount) internal {
    uint256 nexBal = nexToken.balanceOf(address(this));
    if (_amount > nexBal) {
        nexToken.transfer(_to, nexBal);
    } else {
        nexToken.transfer(_to, _amount);
    }
}`,
  },
]

const auditFeatures = [
  { icon: Lock, label: 'ReentrancyGuard', desc: 'All state-changing functions protected' },
  { icon: Shield, label: 'Access Control', desc: 'Ownable for admin functions' },
  { icon: Eye, label: 'Pausable', desc: 'Emergency stop mechanism' },
  { icon: Zap, label: 'SafeERC20', desc: 'Secure token transfers' },
]

export default function ContractShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(contractFiles[activeTab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Smart Contract <span className="text-gradient-gold">Architecture</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built with Solidity ^0.8.20, OpenZeppelin libraries, and industry-standard security practices
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {auditFeatures.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1D26] border border-[#272A33]">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B15] flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{feature.label}</div>
                  <div className="text-[10px] text-slate-500">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#272A33] overflow-hidden bg-[#0A0B0D]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#272A33] bg-[#12141A]">
              <div className="flex gap-1">
                {contractFiles.map((file, i) => (
                  <button key={file.name} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === i ? 'bg-[#F59E0B15] text-gold border border-[#F59E0B30]' : 'text-slate-400 hover:text-white'
                    }`}>
                    <file.icon className="w-3.5 h-3.5" />
                    {file.name}
                  </button>
                ))}
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-[#1A1D26] transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="max-h-96 overflow-auto p-6">
              <pre className="text-sm font-mono leading-relaxed whitespace-pre" style={{ color: '#A9B7C6' }}>
                {contractFiles[activeTab].code}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-[#272A33] bg-[#12141A]">
              <p className="text-xs text-slate-500">{contractFiles[activeTab].description}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
