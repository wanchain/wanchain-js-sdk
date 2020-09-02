delete require.cache[require.resolve('../support/input')];

const { assert } = require('chai');
const WalletCore = require('../../src/core/walletCore');
const { lockState } = require('../support/stateDict');
const {config, SLEEPTIME} = require('../support/config');
const { ethInboundInput } = require('../support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockETHBalance, redeemTokenBalance, ccUtil } = require('../support/utils');
const { canRedeem, getBalance, getMultiTokenBalanceByTokenScAddr, getSmgList } = ccUtil;


describe('ETH-TO-WAN Inbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain, storemanList;
    let calBalances, retLock, retReddem, redeemInputCopy;
    let txHashList, lockReceipt, redeemReceipt;
    let beforeWAN, beforeETH, beforeWETH, afterLockETH, afterRedeemWAN, afterRedeemWETH;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', 'ETH');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        storemanList = (await getSmgList('ETH')).sort((a, b) => b.inboundQuota - a.inboundQuota);
        ethInboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
        ethInboundInput.lockInput.storeman = storemanList[0].ethAddress;
    });

    describe('Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeETH, beforeWETH] = await Promise.all([
                    getBalance(ethInboundInput.lockInput.to),
                    getBalance(ethInboundInput.lockInput.from, 'ETH'),
                    getMultiTokenBalanceByTokenScAddr([ethInboundInput.lockInput.to], srcChain[1].buddy, dstChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            beforeWETH = beforeWETH[ethInboundInput.lockInput.to];
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeETH, '0');
        })
        it('Send Lock Transactions', async () => {
            retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethInboundInput.lockInput);
            !retLock.code && console.log(retLock.result);
            assert.strictEqual(checkHash(retLock.result), true);
            console.log(`The Lock Hash is ${retLock.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: retLock.result});
            while (!lockReceipt) {
               lockReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', retLock.result]);
            }
            assert.strictEqual(lockReceipt.status, '0x1');
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: retLock.result}]);
            }
        })
        it('Check Balance After Sending Lock Transactions', async () => {
            calBalances = lockETHBalance(beforeETH, lockReceipt, ethInboundInput);
            try {
                afterLockETH = await getBalance(ethInboundInput.lockInput.from, 'ETH');
            } catch(e) {
                console.log(`Get After-LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterLockETH.toString(), calBalances);
        })
    })

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: retLock.result});
            let time = (txHashList.htlcTimeOut - txHashList.lockedTime) / 2 / 20 * 19000;
            if (new Date().getTime() < (txHashList.lockedTime + time)) {
                console.log(`Need To Wait ${time / 1000}s To Send Redeem Transaction`)
                await sleep(txHashList.lockedTime + time - new Date().getTime());
            }
            assert.strictEqual((canRedeem(txHashList)).code, true);
            redeemInputCopy = Object.assign({}, ethInboundInput.redeemInput);
            redeemInputCopy.x = txHashList.x;
            redeemInputCopy.hashX = txHashList.hashX;
            retReddem = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)
            !retReddem.code && console.log(retReddem.result);
            assert.strictEqual(checkHash(retReddem.result), true);
            console.log(`The Redeem Hash is ${retReddem.result}`);
            
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: retReddem.result});
            while (!redeemReceipt) {
                redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', retReddem.result]);
            }
            assert.strictEqual(redeemReceipt.status, '0x1');
        })
        it('Check Balance After Sending Redeem Transaction', async () => {
            calBalances = redeemTokenBalance([beforeWAN, beforeWETH], redeemReceipt, ethInboundInput);
            try {
                [afterRedeemWAN, afterRedeemWETH] = await Promise.all([
                    getBalance(ethInboundInput.lockInput.to),
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
