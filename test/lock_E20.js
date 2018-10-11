'use strict';

const config = require('./support/config');
const { e20Input } = require('./support/input');
const BigNumber = require('bignumber.js');
const WalletCore = require('../src/core/walletCore');

const { assert } = require('chai');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, calculateTokenBalance } = require('./support/utils');
const { getTxReceipt, getEthBalance, getMultiTokenBalanceByTokenScAddr } = require('./support/utils').ccUtil;

const SLEEPTIME = 10000;

const stateDict = [
    'ApproveSending',
    'ApproveSendFail',
    'ApproveSendFailAfterRetries',
    'ApproveSent',
    'Approved',
    'LockSending',
    'LockSendFail',
    'LockSendFailAfterRetries',
    'LockSent',
    'Locked',
    'BuddyLocked',
    'RedeemSending',
    'RedeemSendFail',
    'RedeemSendFailAfterRetries',
    'RedeemSent',
    'Redeemed'
];

describe.only('ERC20-TO-WAN Crosschain', () => {
    let walletCore;
    let option;
    let record;

    before(async () => {
        walletCore = new WalletCore(config);
    });
    it('Normal Crosschain Transaction Case.', async () => {
        await walletCore.init();

        let ret, txHashList, approveReceipt, lockReceipt, approveHash;
        let beforeETHBalance, beforeTokenBalance, beforeWtokenBalance;
        let calBalances
        try {
            [beforeETHBalance, beforeTokenBalance, beforeWtokenBalance] = await Promise.all([
                getEthBalance(e20Input.input.from),
                getMultiTokenBalanceByTokenScAddr([e20Input.input.from], e20Input.srcChain[0], e20Input.srcChain[1].tokenType),
                getMultiTokenBalanceByTokenScAddr([e20Input.input.from], e20Input.input.to, e20Input.dstChain[1].tokenType)
            ]);
            [beforeETHBalance, beforeTokenBalance, beforeWtokenBalance] = [beforeETHBalance, beforeTokenBalance[e20Input.input.from], beforeWtokenBalance[e20Input.input.from]]
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }

        assert.notStrictEqual(beforeETHBalance, '0');
        assert.notStrictEqual(beforeTokenBalance, '0');

        ret = await global.crossInvoker.invoke(e20Input.srcChain, e20Input.dstChain, 'LOCK', e20Input.input);
        assert.strictEqual(checkHash(ret.result), true, ret.result);

        approveHash = (global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result})).approveTxHash;

        while (!approveReceipt && !lockReceipt) {
            approveReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', approveHash]) 
            lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
        }
        assert.strictEqual(approveReceipt.status, '0x1');
        assert.strictEqual(lockReceipt.status, '0x1');

        while (stateDict.indexOf(txHashList.status) < stateDict.indexOf('BuddyLocked')) {
            txHashList = await sleepAndUpdateStatus(SLEEPTIME, [config.crossCollection, {lockTxHash: ret.result}]);
        }

        // ======================================Chechk value of before and after ================================

        calBalances = calculateTokenBalance([beforeETHBalance, beforeTokenBalance], [approveReceipt, lockReceipt], e20Input.input)
        assert.strictEqual(afterStep1ETHBalance.toString(), beforeETHBalance.sub(testcore.web3.toWei(lockETHCmdOptions.amount)).sub(gasPrice.mul(gasUsed).mul(gWei)).toString());


























        let receipt = await testcore.getTxReceipt('ETH', lockTxHash);
        assert.equal(receipt.status, "0x1");
        let gasUsed = new BigNumber(receipt.gasUsed);
        let gasPrice = new BigNumber(lockETHCmdOptions.gasPrice);
        let afterStep1ETHBalance = new BigNumber((await testcore.getEthAccountsInfo(getEthAccounts(lockETHCmdOptions.from))).balance);
        assert.equal(afterStep1ETHBalance.toString(), beforeETHBalance.sub(testcore.web3.toWei(lockETHCmdOptions.amount)).sub(gasPrice.mul(gasUsed).mul(gWei)).toString());
        while (stateDict[record.status] < stateDict['waitingX']) {
            record = await testcore.sleepAndUpdateStatus(SLEEPTIME, option);
        }
        assert.equal(record.status, 'waitingX', "record.status is wrong");
        testcore.close();


        let redeemTxHash = await redeemWANCmd.runProc(redeemWANCmdOptions);
        redeemTxHash = redeemTxHash.replace(/[\r\n]/g, "");
        isHash = checkHash(redeemTxHash);
        assert.equal(isHash, true, redeemTxHash);


        await testcore.init();
        while (stateDict[record.status] < stateDict['redeemFinished']) {
            record = await testcore.sleepAndUpdateStatus(sleepTime, option);
        }
        result = await testcore.checkXConfirm(record, waitBlocks);
        assert.equal(record.redeemTxHash, redeemTxHash);
        assert.equal(record.status, 'redeemFinished', "record.status is wrong");
        assert.equal(result.status, "0x1");
        assert.equal(result.from, lockETHCmdOptions.cross.toLowerCase());
        let gasUsed2 = new BigNumber(result.gasUsed);
        let gasPrice2 = new BigNumber(redeemWANCmdOptions.gasPrice);
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
