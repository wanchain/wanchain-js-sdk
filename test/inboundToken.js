'use strict';

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { e20InboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance, redeemTokenBalance, ccUtil } = require('./support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, syncErc20StoremanGroups } = ccUtil;


describe('ERC20-TO-WAN Inbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let calBalances, retCheck;
    let beforeWAN, beforeWToken, beforeETH, beforeToken ;
    let afterLockETH, afterLockToken, afterRedeemWAN, afterRedeemWToken;
    let ret, txHashList, approveReceipt, lockReceipt, redeemReceipt;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr(e20InboundInput.tokenAddr, 'ETH')
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        e20InboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20InboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20InboundInput.tokenAddr))[0].smgOrigAddr;
    });

    describe('Approve And Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeETH, beforeToken, beforeWToken] = await Promise.all([
                    getWanBalance(e20InboundInput.lockInput.to),
                    getEthBalance(e20InboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.from], srcChain[0], srcChain[1].tokenType),
                    getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
                ]);
                [beforeToken, beforeWToken] = [beforeToken[e20InboundInput.lockInput.from], beforeWToken[e20InboundInput.lockInput.to]];
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeETH, '0');
            assert.notStrictEqual(beforeToken, '0');
        })
        it('Send Approve&Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20InboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true, ret.result);
            txHashList = global.wanDb.getItem(config.crossCollection, {lockTxHash: ret.result});
            while (!approveReceipt || !lockReceipt) {
                [approveReceipt, lockReceipt] = await Promise.all([
                    sleepAndUpdateReceipt(SLEEPTIME, ['ETH', txHashList.approveTxHash]),
                    sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result])
                ])
            }
            assert.strictEqual(approveReceipt.status, '0x1');
            assert.strictEqual(lockReceipt.status, '0x1');
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [config.crossCollection, {lockTxHash: ret.result}]);
            }
        })
        it('The Balance After Sending Approve&Lock Transactions', async () => {
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
        })
    })

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
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
        })
        it('Check Balance After Sending Redeem Transaction', async () => {
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
        })
    })
});
