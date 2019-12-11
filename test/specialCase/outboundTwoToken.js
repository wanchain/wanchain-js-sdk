delete require.cache[require.resolve('../support/input')];

const { assert } = require('chai');
const WalletCore = require('../../src/core/walletCore');
const { lockState } = require('../support/stateDict');
const {config, SLEEPTIME} = require('../support/config');
const { e20OutboundInput, e20OutboundInput1 } = require('../support/input');
const { ccUtil, checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt } = require('../support/utils');
const { canRedeem, getBalance, getMultiTokenBalanceByTokenScAddr, getToken2WanRatio, syncErc20StoremanGroups, getTokenInfo } = ccUtil;

describe('WAN-To-ERC20 Outbound Crosschain Transaction For Two Tokens', () => {
    let walletCore, srcChain, dstChain;
    let retCheck, redeemInputCopy;
    let beforeWAN, beforeETH, beforeToken, beforeWToken;
    let ret, txHashList, approveReceipt, lockReceipt, redeemReceipt;

    let dstChain1, beforeToken1, beforeWToken1, ret1, txHashList1, approveReceipt1, lockReceipt1, retCheck1, redeemInputCopy1, redeemReceipt1;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain  = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');

        dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');
        e20OutboundInput.coin2WanRatio = await getToken2WanRatio(e20OutboundInput.tokenAddr);
        e20OutboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20OutboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20OutboundInput.tokenAddr))[0].smgWanAddr;
        e20OutboundInput.lockInput.decimals = (await getTokenInfo(e20OutboundInput.tokenAddr, 'ETH')).decimals;

        dstChain1 = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput1.tokenAddr, 'ETH');
        e20OutboundInput1.coin2WanRatio = await getToken2WanRatio(e20OutboundInput1.tokenAddr);
        e20OutboundInput1.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain1))[0].txFeeRatio;
        e20OutboundInput1.lockInput.storeman = (await syncErc20StoremanGroups(e20OutboundInput1.tokenAddr))[0].smgWanAddr;
        e20OutboundInput1.lockInput.decimals = (await getTokenInfo(e20OutboundInput1.tokenAddr, 'ETH')).decimals;
    });

    describe('Approve And Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeWAN, beforeETH, beforeToken, beforeWToken, beforeToken1, beforeWToken1] = await Promise.all([
                    getBalance(e20OutboundInput.lockInput.from),
                    getBalance(e20OutboundInput.lockInput.to, 'ETH'),
                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.to], dstChain[0], dstChain[1].tokenType),
                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput.lockInput.from], dstChain[1].buddy, srcChain[1].tokenType),

                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput1.lockInput.to], dstChain1[0], dstChain1[1].tokenType),
                    getMultiTokenBalanceByTokenScAddr([e20OutboundInput1.lockInput.from], dstChain1[1].buddy, srcChain[1].tokenType)
                ]);
                [beforeToken, beforeWToken] = [beforeToken[e20OutboundInput.lockInput.to], beforeWToken[e20OutboundInput.lockInput.from]];
                [beforeToken1, beforeWToken1] = [beforeToken1[e20OutboundInput1.lockInput.to], beforeWToken1[e20OutboundInput1.lockInput.from]];

            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            assert.notStrictEqual(beforeWAN, '0');
            assert.notStrictEqual(beforeETH, '0');
            assert.notStrictEqual(beforeWToken, '0');
            assert.notStrictEqual(beforeWToken1, '0');

        });
        it('Send Approve&Lock Transactions', async () => {
            [ret, ret1] = await Promise.all([
                global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput),
                global.crossInvoker.invoke(srcChain, dstChain1, 'LOCK', e20OutboundInput1.lockInput)
            ]);
            assert.strictEqual(checkHash(ret.result), true, ret.result);
            assert.strictEqual(checkHash(ret1.result), true, ret1.result);

            console.log(`The Lock Hash is ${ret.result}`);
            console.log(`The Lock Hash is ${ret1.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            txHashList1 = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret1.result});

            while (!approveReceipt || !lockReceipt) {
                [approveReceipt, lockReceipt] = await Promise.all([
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', txHashList.approveTxHash]),
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret.result])
                ])
            }
            while (!approveReceipt1 || !lockReceipt1) {
                [approveReceipt1, lockReceipt1] = await Promise.all([
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', txHashList1.approveTxHash]),
                    sleepAndUpdateReceipt(SLEEPTIME, ['WAN', ret1.result])
                ])
            }
            assert.strictEqual(approveReceipt.status, '0x1');
            assert.strictEqual(lockReceipt.status, '0x1');
            assert.strictEqual(approveReceipt1.status, '0x1');
            assert.strictEqual(lockReceipt1.status, '0x1');

            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret.result}]);
                console.log(lockState.indexOf(txHashList.status))
            }
            while (lockState.indexOf(txHashList1.status) < lockState.indexOf('BuddyLocked')) {
                txHashList1 = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret1.result}]);
                console.log(lockState.indexOf(txHashList1.status))
            }
        });
    })

    describe('Redeem Transaction', () => {
        it('Send Redeem Transaction', async () => {
            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            txHashList1 = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret1.result});

            retCheck = (canRedeem(txHashList)).code;
            retCheck1 = (canRedeem(txHashList1)).code;

            assert.strictEqual(retCheck, true);
            assert.strictEqual(retCheck1, true);

            redeemInputCopy = Object.assign({}, e20OutboundInput.redeemInput)
            redeemInputCopy.x = txHashList.x;
            redeemInputCopy.hashX = txHashList.hashX;
            redeemInputCopy1 = Object.assign({}, e20OutboundInput1.redeemInput)
            redeemInputCopy1.x = txHashList1.x;
            redeemInputCopy1.hashX = txHashList1.hashX;

            [ret, ret1] = await Promise.all([
                global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy),
                global.crossInvoker.invoke(srcChain, dstChain1, 'REDEEM', redeemInputCopy1)
            ]);

            assert.strictEqual(checkHash(ret.result), true, ret.result);
            assert.strictEqual(checkHash(ret1.result), true, ret.result1);

            console.log(`The Redeem Hash is ${ret.result}`);
            console.log(`The Redeem Hash is ${ret1.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: ret.result});
            txHashList1 = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: ret1.result});

            while (!redeemReceipt) {
                redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result]);
            }
            while (!redeemReceipt1) {
                redeemReceipt1 = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret1.result]);
            }
            assert.strictEqual(redeemReceipt.status, '0x1');
            assert.strictEqual(redeemReceipt1.status, '0x1');
        });
    })
});