// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev 用于测试和演示的 ERC-20 代币
 * 包含水龙头功能，可免费领取测试代币
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10 ** 18;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    
    mapping(address => uint256) public lastFaucetTime;
    
    event Faucet(address indexed user, uint256 amount);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 __decimals,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) {
        _decimals = __decimals;
        _mint(msg.sender, _initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev 水龙头：免费领取测试代币
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Please wait before next faucet"
        );
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit Faucet(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev 批量铸造（仅用于测试）
     */
    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
