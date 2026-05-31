const { expect } = require('chai');
const hre = require('hardhat');

describe('NexusVault', function () {
  let vault, nexToken, weth, usdc, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await hre.ethers.getSigners();

    // Deploy NEX token
    const NexusToken = await hre.ethers.getContractFactory('NexusToken');
    nexToken = await NexusToken.deploy();

    // Deploy Vault
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const NexusVault = await hre.ethers.getContractFactory('NexusVault');
    vault = await NexusVault.deploy(await nexToken.getAddress(), currentBlock + 1);

    // Set minter
    await nexToken.addMinter(await vault.getAddress());

    // Deploy mock tokens
    const MockERC20 = await hre.ethers.getContractFactory('MockERC20');
    weth = await MockERC20.deploy('Wrapped Ether', 'WETH', 18, hre.ethers.parseEther('100000'));
    usdc = await MockERC20.deploy('USD Coin', 'USDC', 6, 100000000n * 10n ** 6n);

    // Add pools
    await vault.addPool(await weth.getAddress(), 300);
    await vault.addPool(await usdc.getAddress(), 400);

    // Fund users
    await weth.transfer(user1.address, hre.ethers.parseEther('100'));
    await usdc.transfer(user1.address, 10000n * 10n ** 6n);
  });

  it('should deploy correctly', async () => {
    expect(await vault.poolLength()).to.equal(2n);
    expect(await vault.totalAllocPoint()).to.equal(700n);
  });

  it('should allow deposit and accrue rewards', async () => {
    const depositAmount = hre.ethers.parseEther('10');
    await weth.connect(user1).approve(await vault.getAddress(), depositAmount);
    await vault.connect(user1).deposit(0, depositAmount);

    const userInfo = await vault.userInfo(0, user1.address);
    expect(userInfo.amount).to.equal(depositAmount);

    // Mine some blocks
    for (let i = 0; i < 10; i++) {
      await hre.network.provider.send('evm_mine');
    }

    const pending = await vault.pendingNex(0, user1.address);
    expect(pending).to.be.gt(0n);
  });

  it('should allow harvest', async () => {
    const depositAmount = hre.ethers.parseEther('10');
    await weth.connect(user1).approve(await vault.getAddress(), depositAmount);
    await vault.connect(user1).deposit(0, depositAmount);

    // Mine blocks
    for (let i = 0; i < 5; i++) {
      await hre.network.provider.send('evm_mine');
    }

    const beforeBalance = await nexToken.balanceOf(user1.address);
    await vault.connect(user1).harvest(0);
    const afterBalance = await nexToken.balanceOf(user1.address);

    expect(afterBalance).to.be.gt(beforeBalance);
  });

  it('should allow withdrawal', async () => {
    const depositAmount = hre.ethers.parseEther('10');
    await weth.connect(user1).approve(await vault.getAddress(), depositAmount);
    await vault.connect(user1).deposit(0, depositAmount);

    const beforeBalance = await weth.balanceOf(user1.address);
    await vault.connect(user1).withdraw(0, depositAmount);
    const afterBalance = await weth.balanceOf(user1.address);

    expect(afterBalance).to.equal(beforeBalance + depositAmount);
  });

  it('should have emergency withdraw with fee', async () => {
    const depositAmount = hre.ethers.parseEther('10');
    await weth.connect(user1).approve(await vault.getAddress(), depositAmount);
    await vault.connect(user1).deposit(0, depositAmount);

    const beforeBalance = await weth.balanceOf(user1.address);
    await vault.connect(user1).emergencyWithdraw(0);
    const afterBalance = await weth.balanceOf(user1.address);

    // Should receive less than full amount due to 1% fee
    expect(afterBalance - beforeBalance).to.be.lt(depositAmount);
    expect(afterBalance - beforeBalance).to.be.gt(0n);
  });

  it('should pause and unpause', async () => {
    await vault.pause();
    await weth.connect(user1).approve(await vault.getAddress(), hre.ethers.parseEther('1'));
    await expect(
      vault.connect(user1).deposit(0, hre.ethers.parseEther('1'))
    ).to.be.revertedWithCustomError(vault, 'EnforcedPause');

    await vault.unpause();
    await vault.connect(user1).deposit(0, hre.ethers.parseEther('1'));
  });
});
