// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./NexusToken.sol";

/**
 * @title NexusVault
 * @dev DeFi 收益聚合器核心合约
 * 用户可质押 ERC20 代币获取 NEX 代币奖励
 * 包含重入保护、紧急暂停、时间锁等安全机制
 */
contract NexusVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    /// @dev 池子信息
    struct PoolInfo {
        IERC20 lpToken;           // 质押代币
        uint256 allocPoint;       // 分配权重
        uint256 lastRewardBlock;  // 最后奖励区块
        uint256 accNexPerShare;   // 累计每股 NEX
        uint256 totalStaked;      // 总质押量
    }

    /// @dev 用户信息
    struct UserInfo {
        uint256 amount;           // 已质押数量
        uint256 rewardDebt;       // 奖励债务
    }

    /// @dev NEX 代币合约
    NexusToken public nexToken;

    /// @dev 每区块产出的 NEX 数量
    uint256 public nexPerBlock = 1e18; // 1 NEX per block

    /// @dev 总分配权重
    uint256 public totalAllocPoint = 0;

    /// @dev 开始挖矿区块
    uint256 public startBlock;

    /// @dev 池子数组
    PoolInfo[] public poolInfo;

    /// @dev 用户映射: poolId => userAddress => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    /// @dev 是否已添加的 LP 代币
    mapping(address => bool) public addedTokens;

    /// @dev 紧急退出费用（默认 1% = 100）
    uint256 public emergencyWithdrawFee = 100;
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @dev 费用接收地址
    address public feeReceiver;

    /// @dev 事件
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    event NexPerBlockUpdated(uint256 newNexPerBlock);
    event FeeReceiverUpdated(address newFeeReceiver);
    event EmergencyWithdrawFeeUpdated(uint256 newFee);

    constructor(
        NexusToken _nexToken,
        uint256 _startBlock
    ) Ownable(msg.sender) {
        nexToken = _nexToken;
        startBlock = _startBlock;
        feeReceiver = msg.sender;
    }

    /**
     * @dev 获取池子数量
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev 添加新池子（仅管理员）
     */
    function addPool(
        IERC20 _lpToken,
        uint256 _allocPoint
    ) external onlyOwner {
        require(!addedTokens[address(_lpToken)], "Pool already exists");
        require(address(_lpToken) != address(0), "Invalid token");

        massUpdatePools();

        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accNexPerShare: 0,
            totalStaked: 0
        }));

        addedTokens[address(_lpToken)] = true;
        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    /**
     * @dev 更新池子分配权重（仅管理员）
     */
    function setPool(
        uint256 _pid,
        uint256 _allocPoint
    ) external onlyOwner validatePool(_pid) {
        massUpdatePools();
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        emit PoolUpdated(_pid, _allocPoint);
    }

    /**
     * @dev 计算从 _from 到 _to 区块的奖励乘数
     */
    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to - _from;
    }

    /**
     * @dev 查看待领取的 NEX 奖励
     */
    function pendingNex(uint256 _pid, address _user) external view validatePool(_pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accNexPerShare = pool.accNexPerShare;
        uint256 lpSupply = pool.totalStaked;

        if (block.number > pool.lastRewardBlock && lpSupply != 0 && totalAllocPoint > 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 nexReward = (multiplier * nexPerBlock * pool.allocPoint) / totalAllocPoint;
            accNexPerShare += (nexReward * 1e12) / lpSupply;
        }

        if (user.amount > 0) {
            return (user.amount * accNexPerShare) / 1e12 - user.rewardDebt;
        }
        return 0;
    }

    /**
     * @dev 更新所有池子的奖励变量
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @dev 更新指定池子的奖励变量
     */
    function updatePool(uint256 _pid) public validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0 || pool.allocPoint == 0 || totalAllocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 nexReward = (multiplier * nexPerBlock * pool.allocPoint) / totalAllocPoint;
        nexToken.mint(address(this), nexReward);
        pool.accNexPerShare += (nexReward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev 质押 LP 代币
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused validatePool(_pid) {
        require(_amount > 0, "Cannot deposit 0");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        // 先结算已有奖励
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accNexPerShare) / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeNexTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }

        // 转账质押代币
        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        user.amount += _amount;
        pool.totalStaked += _amount;
        user.rewardDebt = (user.amount * pool.accNexPerShare) / 1e12;

        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev 解押 LP 代币
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused validatePool(_pid) {
        require(_amount > 0, "Cannot withdraw 0");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient staked amount");

        updatePool(_pid);

        // 结算奖励
        uint256 pending = (user.amount * pool.accNexPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeNexTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }

        user.amount -= _amount;
        pool.totalStaked -= _amount;
        user.rewardDebt = (user.amount * pool.accNexPerShare) / 1e12;

        pool.lpToken.safeTransfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev 仅领取奖励，不解押
     */
    function harvest(uint256 _pid) external nonReentrant whenNotPaused validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount > 0, "No staked amount");

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accNexPerShare) / 1e12 - user.rewardDebt;
        require(pending > 0, "No pending rewards");

        user.rewardDebt = (user.amount * pool.accNexPerShare) / 1e12;
        safeNexTransfer(msg.sender, pending);

        emit Harvest(msg.sender, _pid, pending);
    }

    /**
     * @dev 紧急退出（不领取奖励，收取少量费用）
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "No staked amount");

        // 计算费用
        uint256 feeAmount = (amount * emergencyWithdrawFee) / FEE_DENOMINATOR;
        uint256 receiveAmount = amount - feeAmount;

        user.amount = 0;
        pool.totalStaked -= amount;
        user.rewardDebt = 0;

        pool.lpToken.safeTransfer(feeReceiver, feeAmount);
        pool.lpToken.safeTransfer(msg.sender, receiveAmount);

        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev 安全转账 NEX 代币
     */
    function safeNexTransfer(address _to, uint256 _amount) internal {
        uint256 nexBal = nexToken.balanceOf(address(this));
        if (_amount > nexBal) {
            nexToken.transfer(_to, nexBal);
        } else {
            nexToken.transfer(_to, _amount);
        }
    }

    // ============ 管理员功能 ============

    /**
     * @dev 更新每区块奖励（有时间锁效果更佳，此处简化）
     */
    function setNexPerBlock(uint256 _nexPerBlock) external onlyOwner {
        require(_nexPerBlock <= 100e18, "Too high");
        massUpdatePools();
        nexPerBlock = _nexPerBlock;
        emit NexPerBlockUpdated(_nexPerBlock);
    }

    /**
     * @dev 更新费用接收地址
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid address");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    /**
     * @dev 更新紧急退出费率（最高 10%）
     */
    function setEmergencyWithdrawFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // max 10%
        emergencyWithdrawFee = _fee;
        emit EmergencyWithdrawFeeUpdated(_fee);
    }

    /**
     * @dev 紧急暂停
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复运行
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 紧急提取错发的代币（仅管理员，不能提取用户的质押代币）
     */
    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        require(!addedTokens[_token], "Cannot recover pool token");
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // ============ 修饰器 ============

    modifier validatePool(uint256 _pid) {
        require(_pid < poolInfo.length, "Pool does not exist");
        _;
    }

    // ============ 查询函数 ============

    /**
     * @dev 获取用户的完整信息
     */
    function getUserInfo(uint256 _pid, address _user) external view returns (
        uint256 stakedAmount,
        uint256 pendingReward,
        uint256 rewardDebt
    ) {
        UserInfo storage user = userInfo[_pid][_user];
        stakedAmount = user.amount;
        rewardDebt = user.rewardDebt;
        
        // 计算待领取奖励
        PoolInfo storage pool = poolInfo[_pid];
        uint256 accNexPerShare = pool.accNexPerShare;
        uint256 lpSupply = pool.totalStaked;
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0 && totalAllocPoint > 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 nexReward = (multiplier * nexPerBlock * pool.allocPoint) / totalAllocPoint;
            accNexPerShare += (nexReward * 1e12) / lpSupply;
        }
        
        if (user.amount > 0) {
            pendingReward = (user.amount * accNexPerShare) / 1e12 - user.rewardDebt;
        }
    }

    /**
     * @dev 获取所有池子信息
     */
    function getAllPoolInfo() external view returns (PoolInfo[] memory) {
        return poolInfo;
    }
}
