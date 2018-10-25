'use strict';

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { e20OutboundInput } = require('./support/input');
const { ccUtil, checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance } = require('./support/utils');
const { getWanBalance, getMultiTokenBalanceByTokenScAddr, getToken2WanRatio, syncErc20StoremanGroups } = ccUtil;

describe('WAN-To-ERC20 Outbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let calBalances;
    let beforeWAN, beforeWToken;
    let afterLockWAN, afterLockWToken;
    let ret, txHashList, approveReceipt, lockReceipt;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain  = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');
        e20OutboundInput.coin2WanRatio = await getToken2WanRatio(e20OutboundInput.tokenAddr);
        e20OutboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20OutboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20OutboundInput.tokenAddr))[0].smgWanAddr;
    });

    describe('Approve And Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeWToken] = await Promise.all([
                    getWanBalance(e20OutboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType)
                ]);
                beforeWToken = beforeWToken[e20OutboundInput.lockInput.from];
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeWToken, '0');
        });
        it('Send Approve&Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true, ret.result);
            console.log('ret:',ret);
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            while (!approveReceipt || !lockReceipt) {
                [approveReceipt, lockReceipt] = await Promise.all([
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', txHashList.approveTxHash]),
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result])
                ])
            }
            assert.strictEqual(approveReceipt.status, '0x1');
            assert.strictEqual(lockReceipt.status, '0x1');
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret.result}]);
            }
        });
        it('The Balance After Sending Approve&Lock Transactions', async () => {
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
        });
    })
});