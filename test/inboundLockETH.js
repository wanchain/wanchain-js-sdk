delete require.cache[require.resolve('./support/input')];

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { ethInboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockETHBalance, ccUtil } = require('./support/utils');
const { getBalance, getMultiTokenBalanceByTokenScAddr, getSmgList } = ccUtil;


describe('ETH-TO-WAN Inbound Lock Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain, storemanList;
    let calBalances, ret;
    let txHashList, lockReceipt;
    let beforeWAN, beforeETH, beforeWETH, afterLockETH;

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
            console.log(ethInboundInput.lockInput)
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
                afterLockETH = await getBalance(ethInboundInput.lockInput.from, 'ETH');
            } catch(e) {
                console.log(`Get After-LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterLockETH.toString(), calBalances);
        })
    })
});
