'use strict';

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { ethInboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockETHBalance, redeemTokenBalance, ccUtil } = require('./support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, getEthSmgList } = ccUtil;


describe('ETH-TO-WAN Inbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let calBalances, retCheck, storemanList;
    let ret, txHashList, lockReceipt, redeemReceipt;
    let beforeWAN, beforeETH, beforeWETH, afterLockETH, afterRedeemWAN, afterRedeemWETH;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        storemanList = (await getEthSmgList()).sort((a, b) => b.inboundQuota - a.inboundQuota);
        ethInboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
        ethInboundInput.lockInput.storeman = storemanList[0].ethAddress;
    });

    describe('Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeETH, beforeWETH] = await Promise.all([
                    getWanBalance(ethInboundInput.lockInput.to),
                    getEthBalance(ethInboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([ethInboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
                ]);
                beforeWETH = beforeWETH[ethInboundInput.lockInput.to];
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeETH, '0');
        })
        it('Send Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethInboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true);
            console.log(`The Lock Hash is ${ret.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            while (!lockReceipt) {
               lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
            }
            assert.strictEqual(lockReceipt.status, '0x1');
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret.result}]);
            }
        })
        it('Check Balance After Sending Lock Transactions', async () => {
            calBalances = lockETHBalance(beforeETH, lockReceipt, ethInboundInput);
            try {
                afterLockETH = await getEthBalance(ethInboundInput.lockInput.from);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterLockETH.toString(), calBalances);
        })
    })

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            retCheck = (canRedeem(txHashList)).code;
            assert.strictEqual(retCheck, true);
    
            ethInboundInput.redeemInput.x = txHashList.x;
            ethInboundInput.redeemInput.hashX = txHashList.hashX;
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', ethInboundInput.redeemInput)
            assert.strictEqual(checkHash(ret.result), true);
            console.log(`The Redeem Hash is ${ret.result}`);
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: ret.result});
            while (!redeemReceipt) {
                redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result]);
            }
            assert.strictEqual(redeemReceipt.status, '0x1');
        })
        it('Check Balance After Sending Redeem Transaction', async () => {
            calBalances = redeemTokenBalance([beforeWAN, beforeWETH], redeemReceipt, ethInboundInput);
            try {
                [afterRedeemWAN, afterRedeemWETH] = await Promise.all([
                    getWanBalance(ethInboundInput.lockInput.to),
                    getMultiTokenBalanceByTokenScAddr([ethInboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterRedeemWAN.toString(), calBalances[0]);
            assert.strictEqual(afterRedeemWETH[ethInboundInput.lockInput.to].toString(), calBalances[1]);
        })
    })
});
