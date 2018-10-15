'use strict';

const {config, SLEEPTIME} = require('./support/config');
const { e20OutboundInput } = require('./support/input');
const WalletCore = require('../src/core/walletCore');

const { assert } = require('chai');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance, redeemTokenBalance } = require('./support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, getToken2WanRatio } = require('./support/utils').ccUtil;



const {stateDict} = require('./support/stateDict');

describe.only('WAN To ERC20 Crosschain', () => {
    let walletCore;

    before(async () => {
        walletCore = new WalletCore(config);
    });
    it('Normal Crosschain Transaction Case.', async () => {
        await walletCore.init();

        let calBalances, retCheck;
        let ret, txHashList, approveReceipt, lockReceipt, redeemReceipt;
        let beforeWAN, beforeETH, beforeToken, beforeWToken;
        let afterLockWAN, afterLockWToken;
        let afterRedeemETH, afterRedeemToken;
        let srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');

        e20OutboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20OutboundInput.coin2WanRatio = await getToken2WanRatio(e20OutboundInput.tokenAddr);
        try {
            [beforeWAN, beforeETH, beforeToken, beforeWToken] = await Promise.all([
                getWanBalance(e20OutboundInput.lockInput.from),
                getEthBalance(e20OutboundInput.lockInput.to),
                getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.to], dstChain[0], dstChain[1].tokenType),
                getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType)
            ]);
            [beforeToken, beforeWToken] = [beforeToken[e20OutboundInput.lockInput.to], beforeWToken[e20OutboundInput.lockInput.from]];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeWAN, '0');
        assert.notStrictEqual(beforeETH, '0');
        assert.notStrictEqual(beforeWToken, '0');

        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput);
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log('ret:',ret);

        txHashList = global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result});
        while (!approveReceipt || !lockReceipt) {
            approveReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', txHashList.approveTxHash]);
            lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result]);
        }
        assert.strictEqual(approveReceipt.status, '0x1');
        assert.strictEqual(lockReceipt.status, '0x1');
        while (stateDict.indexOf(txHashList.status) < stateDict.indexOf('BuddyLocked')) {
            txHashList = await sleepAndUpdateStatus(SLEEPTIME, [config.crossCollection, {lockTxHash: ret.result}]);
        }

        // ====================================== Chechk value, before and after, Lock ================================
        calBalances = lockTokenBalance([beforeWAN, beforeWToken], [approveReceipt, lockReceipt], e20OutboundInput, 'outbound');
        try {
            [afterLockWAN, afterLockWToken] = await Promise.all([
                getWanBalance(e20OutboundInput.lockInput.from),
                getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterLockWAN.toString(), calBalances[0]);
        assert.strictEqual(afterLockWToken[e20OutboundInput.lockInput.from].toString(), calBalances[1]);

        // ====================================== Redeem Transaction ================================
        txHashList = global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result});
        retCheck = (canRedeem(txHashList)).code;
        assert.strictEqual(retCheck, true);

        e20OutboundInput.redeemInput.x = txHashList.x;
        e20OutboundInput.redeemInput.hashX = txHashList.hashX;
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', e20OutboundInput.redeemInput)
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log('ret:',ret)
        txHashList = global.wanDb.getItem(config.crossCollection, {redeemTxHash: ret.result});
        while (!redeemReceipt) {
            redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
        }
        assert.strictEqual(redeemReceipt.status, '0x1');

        // ====================================== Chechk value, before and after, Redeem ================================
        calBalances = redeemTokenBalance([beforeETH, beforeToken], [redeemReceipt], e20OutboundInput);
        try {
            [afterRedeemETH, afterRedeemToken] = await Promise.all([
                getEthBalance(e20OutboundInput.lockInput.to),
                getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.to], dstChain[0], dstChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterRedeemETH.toString(), calBalances[0]);
        assert.strictEqual(afterRedeemToken[e20OutboundInput.lockInput.to].toString(), calBalances[1]);
        console.log('success');
    });
});