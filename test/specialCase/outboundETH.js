delete require.cache[require.resolve('../support/input')];

const { assert } = require('chai');
const WalletCore = require('../../src/core/walletCore');
const { lockState } = require('../support/stateDict');
const {config, SLEEPTIME} = require('../support/config');
const { ethOutboundInput } = require('../support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockWETHBalance, redeemETHBalance, ccUtil } = require('../support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, getEthSmgList, getEthC2wRatio } = ccUtil;


describe('WAN-TO-ETH Outbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let ret, calBalances, storemanList, redeemInputCopy;
    let txHashList, lockReceipt, redeemReceipt;
    let beforeWAN, beforeETH, beforeWETH, afterLockWAN, afterLockWETH, afterRedeemETH;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
        storemanList = (await getEthSmgList()).sort((a, b) => b.outboundQuota - a.outboundQuota);
        ethOutboundInput.coin2WanRatio = await getEthC2wRatio();
        ethOutboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
        ethOutboundInput.lockInput.storeman = storemanList[0].wanAddress;
    });

    describe('Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeETH, beforeWETH] = await Promise.all([
                    getWanBalance(ethOutboundInput.lockInput.from),
                    getEthBalance(ethOutboundInput.lockInput.to),
                    getMultiTokenBalanceByTokenScAddr([ethOutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            beforeWETH = beforeWETH[ethOutboundInput.lockInput.from];
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeETH, '0');
        })
        it('Send Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethOutboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true);
            console.log(`The Lock Hash is ${ret.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            while (!lockReceipt) {
               lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result]);
            }
            assert.strictEqual(lockReceipt.status, '0x1');
            console.log(lockReceipt.status)
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret.result}]);
                console.log(lockState.indexOf(txHashList.status))
            }
        })
        it('Check Balance After Sending Lock Transactions', async () => {
            calBalances = lockWETHBalance([beforeWAN, beforeWETH], lockReceipt, ethOutboundInput);
            try {
                [afterLockWAN, afterLockWETH] = await Promise.all([
                    getWanBalance(ethOutboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([ethOutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterLockWAN.toString(), calBalances[0]);
            assert.strictEqual(afterLockWETH[ethOutboundInput.lockInput.from].toString(), calBalances[1]);
        })
    })

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            let time = (txHashList.htlcTimeOut - txHashList.lockedTime) / 2 / 20 * 19000;
            if (new Date().getTime() < (txHashList.lockedTime + time)) {
                console.log(`Need To Wait ${time / 1000}s To Send Redeem Transaction`)
                await sleep(txHashList.lockedTime + time - new Date().getTime());
            }
            assert.strictEqual((canRedeem(txHashList)).code, true);
            redeemInputCopy = Object.assign({}, ethOutboundInput.redeemInput)
            redeemInputCopy.x = txHashList.x;
            redeemInputCopy.hashX = txHashList.hashX;
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)
            assert.strictEqual(checkHash(ret.result), true);
            console.log(`The Redeem Hash is ${ret.result}`);
            
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: ret.result});
            while (!redeemReceipt) {
                redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
            }
            assert.strictEqual(redeemReceipt.status, '0x1');
        })
        it('Check Balance After Sending Redeem Transaction', async () => {
            calBalances = redeemETHBalance(beforeETH, redeemReceipt, ethOutboundInput);
            try {
                afterRedeemETH = await getEthBalance(ethOutboundInput.lockInput.to)
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterRedeemETH.toString(), calBalances);
        })
    })
});
