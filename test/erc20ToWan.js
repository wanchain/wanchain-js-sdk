'use strict';

const fs = require('fs');
const cfg = require('./support/config');
const input = require('./support/input');
const BigNumber = require('bignumber.js');
const WalletCore = require('../src/core/walletCore');

const { assert } = require('chai');
const { listAccounts, checkHash, getEthAccountInfo, getTokenByAddr } = require('./support/utils');
const { CrossChainE20Approve, CrossChainE20Lock, CrossChainE20Revoke, CrossChainE20Refund} = require('../src/trans/CrossChain');

const stateDict = [
    'LockSending',
    'LockSendFail',
    'LockSendFailAfterRetries',
    'LockSent',
    'Locked',
    'BuddyLocked',
    'RefundSending',
    'RefundSendFail',
    'RefundSendFailAfterRetries',
    'RefundSent',
    'Refunded'
];

const cfgERC20 = Object.assign({}, cfg, {
  srcChain: 'DPY',
  dstChain: 'WAN',
  srcKeystorePath: '/home/jason/.ethereum/testnet/keystore',
  dstKeyStorePath: '/home/jason/.ethereum/testnet/keystore',
  lockClass: 'CrossChainEthLock',
  refundClass: 'CrossChainEthRefund',
  revokeClass: 'CrossChainEthRevoke',
  approveScFunc: 'approve',
  lockScFunc: 'eth2wethLock',
  refundScFunc: 'eth2wethRefund',
  revokeScFunc: 'eth2wethRevoke',
  srcChainType: 'ETH',
  dstChainType: 'WAN'
});

const approveInput = Object.assign({}, input, {
  action: 'Approve',
  storemanAddr: '0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8'
})

let localAccounts = {};

describe.only('ERC20-TO-WAN Crosschain', () => {
    let testcore;
    let option;
    let record;
  
    before(async (done) => {
      localAccounts.eth = listAccounts(cfgERC20.ethKeyStorePath);
      localAccounts.wan = listAccounts(cfgERC20.wanKeyStorePath);
      testcore = new WalletCore(cfgERC20);
      await testcore.init();
      done();
    });
    it('Normal Crosschain Transaction Case.', async () => {

      let [beforeETHBalance, beforeTokenBalance, result] = await Promise.all([
        getEthAccountInfo(localAccounts.eth, approveInput.from), 
        getTokenByAddr(approveInput.from, approveInput.to, 'ETH'),
        (new CrossChainE20Approve(approveInput, cfgERC20)).run()
      ])

      let approveTxHash = result.result.replace(/[\r\n]/g, "");
      console.log(`Approve Trans successfully:${approveTxHash}`);

      let isHash = checkHash(approveTxHash);
      assert.equal(isHash, true, approveTxHash);
      console.log(1111);
      process.exit(0);


      refundWANCmdOptions.lockTxHash = lockTxHash;
      record = await testcore.getRecord(option);
      assert.equal(record.lockTxHash, lockTxHash);
      assert.equal(record.status, 'sentHashPending', "record.status is wrong");
      while (stateDict[record.status] < stateDict['waitingCross']) {
        record = await testcore.sleepAndUpdateStatus(sleepTime, option);
      }
      let receipt = await testcore.getTxReceipt('ETH', lockTxHash);
      assert.equal(receipt.status, "0x1");
      let gasUsed = new BigNumber(receipt.gasUsed);
      let gasPrice = new BigNumber(lockETHCmdOptions.gasPrice);
      let afterStep1ETHBalance = new BigNumber((await testcore.getEthAccountsInfo(getEthAccounts(lockETHCmdOptions.from))).balance);
      assert.equal(afterStep1ETHBalance.toString(), beforeETHBalance.sub(testcore.web3.toWei(lockETHCmdOptions.amount)).sub(gasPrice.mul(gasUsed).mul(gWei)).toString());
      while (stateDict[record.status] < stateDict['waitingX']) {
        record = await testcore.sleepAndUpdateStatus(sleepTime, option);
      }
      assert.equal(record.status, 'waitingX', "record.status is wrong");
      testcore.close();
  
  
      let refundTxHash = await refundWANCmd.runProc(refundWANCmdOptions);
      refundTxHash = refundTxHash.replace(/[\r\n]/g, "");
      isHash = checkHash(refundTxHash);
      assert.equal(isHash, true, refundTxHash);
  
  
      await testcore.init(); 
      while (stateDict[record.status] < stateDict['refundFinished']) {
        record = await testcore.sleepAndUpdateStatus(sleepTime, option);
      }
      result = await testcore.checkXConfirm(record, waitBlocks);
      assert.equal(record.refundTxHash, refundTxHash);
      assert.equal(record.status, 'refundFinished', "record.status is wrong");
      assert.equal(result.status, "0x1");
      assert.equal(result.from, lockETHCmdOptions.cross.toLowerCase());
      let gasUsed2 = new BigNumber(result.gasUsed);
      let gasPrice2 = new BigNumber(refundWANCmdOptions.gasPrice);
      let afterStep2ETHBalance = new BigNumber((await testcore.getEthAccountsInfo(getEthAccounts(lockETHCmdOptions.from))).balance);
      let afterStep2WanAccountInfo = await testcore.getWanAccountsInfo(lockETHCmdOptions.cross);
      let afterStep2WETHBalance = new BigNumber(afterStep2WanAccountInfo.wethBalance);
      let afterStep2WANBalance = new BigNumber(afterStep2WanAccountInfo.balance);
      assert.equal(afterStep2ETHBalance.toString(), afterStep1ETHBalance.toString());
      assert.equal(afterStep2WETHBalance.toString(), beforeWETHBalance.add(testcore.web3.toWei(lockETHCmdOptions.amount)).toString());
      assert.equal(afterStep2WANBalance.toString(), beforeWANBalance.sub(gasPrice2.mul(gasUsed2).mul(gWei)).toString());
      testcore.close();
  
    });
});
