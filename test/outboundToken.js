const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { e20OutboundInput } = require('./support/input');
const { ccUtil, checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance, redeemTokenBalance } = require('./support/utils');
const { canRedeem, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, getToken2WanRatio, syncErc20StoremanGroups, getErc20Info } = ccUtil;

describe('WAN-To-ERC20 Outbound Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let calBalances, retCheck;
    let beforeWAN, beforeETH, beforeToken, beforeWToken;
    let afterLockWAN, afterLockWToken, afterRedeemETH, afterRedeemToken;
    let ret, txHashList, approveReceipt, lockReceipt, redeemReceipt;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain  = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');
        e20OutboundInput.coin2WanRatio = await getToken2WanRatio(e20OutboundInput.tokenAddr);
        e20OutboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20OutboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20OutboundInput.tokenAddr))[0].smgWanAddr;
        e20OutboundInput.lockInput.decimals = (await getErc20Info(e20OutboundInput.tokenAddr)).decimals;
    });

    describe('Approve And Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
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
        });
        it('Send Approve&Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true, ret.result);
            console.log(`The Lock Hash is ${ret.result}`);
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

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            retCheck = (canRedeem(txHashList)).code;
            assert.strictEqual(retCheck, true);
    
            e20OutboundInput.redeemInput.x = txHashList.x;
            e20OutboundInput.redeemInput.hashX = txHashList.hashX;
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', e20OutboundInput.redeemInput)
            assert.strictEqual(checkHash(ret.result), true, ret.result);
            console.log(`The Redeem Hash is ${ret.result}`);
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: ret.result});
            while (!redeemReceipt) {
                redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
            }
            assert.strictEqual(redeemReceipt.status, '0x1');
        });
        it('Check Balance After Sending Redeem Transaction', async () => {
            calBalances = redeemTokenBalance([beforeETH, beforeToken], redeemReceipt, e20OutboundInput);
            try {
                [afterRedeemETH, afterRedeemToken] = await Promise.all([
                    getEthBalance(e20OutboundInput.lockInput.to),
                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.to], dstChain[0], dstChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: $ {e}`);
            }
            assert.strictEqual(afterRedeemETH.toString(), calBalances[0]);
            assert.strictEqual(afterRedeemToken[e20OutboundInput.lockInput.to].toString(), calBalances[1]);
        });
    })
});