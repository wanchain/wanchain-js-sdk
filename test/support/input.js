const WANADDR_1 = '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17';
const ETHADDR_1 = '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8';
const ETHADDR_2 = '0x88f9d861d02123e7fc783af1a7481f43d58e46fd';
const E20TOKENADDR = '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8';
const SYMBOL = 'ZRX';

const WAN_PARA = {
    gasPrice: '180',
    gasLimit: '470000',
    password: '123qwe!@#'
};
const ETH_PARA = {
    gasPrice: '10',
    gasLimit: '470000',
    password: '123qweasd'
};

// ============================== Instance INPUT ======================================
const ethInboundInput = {
    lockInput: Object.assign({
        from: ETHADDR_1,
        to: WANADDR_1,
        amount: '0.00113',
    }, ETH_PARA),
    redeemInput: WAN_PARA,
    revokeInput: ETH_PARA
};

const ethOutboundInput = {
    lockInput: Object.assign({
        from: WANADDR_1,
        to: ETHADDR_1,
        amount: '0.0003',
    }, WAN_PARA),
    redeemInput: ETH_PARA,
    revokeInput: WAN_PARA
};

const e20InboundInput = {
    symbol: SYMBOL,
    tokenAddr: E20TOKENADDR,
    lockInput: Object.assign({
        from: ETHADDR_1,
        to: WANADDR_1,
        amount: '0.00113',
    }, ETH_PARA),
    redeemInput: WAN_PARA,
    revokeInput: ETH_PARA
}

const e20OutboundInput = {
    symbol: SYMBOL,
    tokenAddr: E20TOKENADDR,
    lockInput: Object.assign({
        from: WANADDR_1,
        to: ETHADDR_1,
        amount: '0.00001'
    }, WAN_PARA),
    redeemInput: ETH_PARA,
    revokeInput: WAN_PARA
}

const transferETHInput = Object.assign({
    from: ETHADDR_1,
    to: ETHADDR_2,
    amount: '0.00001'
}, ETH_PARA);

const transferTokenInput = Object.assign({
    symbol: SYMBOL,
    tokenAddr: E20TOKENADDR,
    from: ETHADDR_1,
    to: ETHADDR_2,
    amount: '0.00021'
}, ETH_PARA);


module.exports = {
    e20InboundInput,
    e20OutboundInput,
    transferETHInput,
    transferTokenInput,
    ethInboundInput,
    ethOutboundInput,
};