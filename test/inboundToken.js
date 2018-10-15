'use strict';

const {config, SLEEPTIME} = require('./support/config');
const { e20InboundInput } = require('./support/input');
const WalletCore = require('../src/core/walletCore');

const { assert } = require('chai');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance, redeemTokenBalance } = require('./support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr } = require('./support/utils').ccUtil;

const {stateDict} = require('./support/stateDict');

describe.only('ERC20-TO-WAN Crosschain', () => {
    let walletCore;

    before(async () => {
        walletCore = new WalletCore(config);
    });
    it('Normal Crosschain Transaction Case.', async () => {
        await walletCore.init();

        let calBalances, retCheck;
        let ret, txHashList, approveReceipt, lockReceipt, redeemReceipt;
        let beforeWAN, beforeWToken, beforeETH, beforeToken ;
        let afterLockETH, afterLockToken;
        let afterRedeemWAN, afterRedeemWToken;  
        let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(e20InboundInput.tokenAddr, 'ETH')
        let dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');

        e20InboundInput.lockInput.txFeeRatio = (global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        try {
            [beforeETH, beforeToken, beforeWAN, beforeWToken] = await Promise.all([
                getEthBalance(e20InboundInput.lockInput.from),
                getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.from], srcChain[0], srcChain[1].tokenType),
                getWanBalance(e20InboundInput.lockInput.to),
                getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
            ]);
            [beforeToken, beforeWToken] = [beforeToken[e20InboundInput.lockInput.from], beforeWToken[e20InboundInput.lockInput.to]];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeWAN, '0');
        assert.notStrictEqual(beforeETH, '0');
        assert.notStrictEqual(beforeToken, '0');
        
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20InboundInput.lockInput);
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log('ret:',ret)
        txHashList = global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result});
        while (!approveReceipt || !lockReceipt) {
            approveReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', txHashList.approveTxHash]);
            lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
        }

        assert.strictEqual(approveReceipt.status, '0x1');
        assert.strictEqual(lockReceipt.status, '0x1');
        while (stateDict.indexOf(txHashList.status) < stateDict.indexOf('BuddyLocked')) {
            txHashList = await sleepAndUpdateStatus(SLEEPTIME, [config.crossCollection, {lockTxHash: ret.result}]);
        }

        // ====================================== Chechk value, before and after, Approve && Lock ================================
        calBalances = lockTokenBalance([beforeETH, beforeToken], [approveReceipt, lockReceipt], e20InboundInput);
        try {
            [afterLockETH, afterLockToken] = await Promise.all([
                getEthBalance(e20InboundInput.lockInput.from),
                getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.from], srcChain[0], srcChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterLockETH.toString(), calBalances[0]);
        assert.strictEqual(afterLockToken[e20InboundInput.lockInput.from].toString(), calBalances[1]);
        
        // ====================================== Redeem Transaction ================================

        txHashList = global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result});
        retCheck = (canRedeem(txHashList)).code;
        assert.strictEqual(retCheck, true);

        e20InboundInput.redeemInput.x = txHashList.x;
        e20InboundInput.redeemInput.hashX = txHashList.hashX;
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', e20InboundInput.redeemInput)
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log('ret:',ret)
        txHashList = global.wanDb.getItem(config.crossCollection, {redeemTxHash: ret.result});
        while (!redeemReceipt) {
            redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result]);
        }
        assert.strictEqual(redeemReceipt.status, '0x1');

        // ====================================== Chechk value, before and after, Redeem ================================
        calBalances = redeemTokenBalance([beforeWAN, beforeWToken], [redeemReceipt], e20InboundInput);
        try {
            [afterRedeemWAN, afterRedeemWToken] = await Promise.all([
                getWanBalance(e20InboundInput.lockInput.to),
                getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterRedeemWAN.toString(), calBalances[0]);
        assert.strictEqual(afterRedeemWToken[e20InboundInput.lockInput.to].toString(), calBalances[1]);
    });
});
