// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexusToken
 * @dev NexusVault 平台的治理和奖励代币
 * 用于奖励质押用户的 ERC-20 代币
 */
contract NexusToken is ERC20, Ownable {
    /// @dev 铸造者地址映射（如 Vault 合约）
    mapping(address => bool) public minters;
    
    /// @dev 最大供应量: 10,000,000 NEX
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10 ** 18;
    
    /// @dev 当前已铸造量
    uint256 public totalMinted;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    modifier onlyMinter() {
        require(minters[msg.sender], "NexusToken: caller is not a minter");
        _;
    }
    
    constructor() ERC20("Nexus Token", "NEX") Ownable(msg.sender) {
        // 初始铸造 100,000 NEX 给部署者用于流动性
        _mint(msg.sender, 100_000 * 10 ** 18);
        totalMinted = 100_000 * 10 ** 18;
    }
    
    /**
     * @dev 添加铸造者权限
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    /**
     * @dev 移除铸造者权限
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    /**
     * @dev 铸造代币（仅铸造者可调用）
     */
    function mint(address _to, uint256 _amount) external onlyMinter {
        require(totalMinted + _amount <= MAX_SUPPLY, "Max supply exceeded");
        totalMinted += _amount;
        _mint(_to, _amount);
    }
    
    /**
     * @dev 销毁代币
     */
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
        totalMinted -= _amount;
    }
}
