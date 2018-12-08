//define your account addresss
const WANADDR = '0xf796ec9ae2491216163f1fe409a26f32a7abf8ba';
const ETHADDR = '0x19879b986d8bc1849804f46b1d4f4c6242df068c';
const E20TOKENADDR = '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8';

const SYMBOL = 'MKR';
const WSYMBOL = 'WMKR';

//define your wanchain gas parameter
const WAN_PARA = {
    gasPrice: '180',
    gasLimit: '470000',
    password: 'qazwsx'
};

//define your ethereum gas parameter
const ETH_PARA = {
    gasPrice: '10',
    gasLimit: '470000',
    password: 'qazwsx'
};

// ============================== Instance INPUT ======================================
const ethInboundInput = {
    lockInput: Object.assign({}, {
        from: ETHADDR,
        to: WANADDR,
        amount: '0.00113',
    }, ETH_PARA),
    redeemInput: WAN_PARA,
    revokeInput: ETH_PARA
};

const ethOutboundInput = {
    lockInput: Object.assign({}, {
        from: WANADDR,
        to: ETHADDR,
        amount: '0.0003',
    }, WAN_PARA),
    redeemInput: ETH_PARA,
    revokeInput: WAN_PARA
};

const e20InboundInput = {
    symbol: SYMBOL,
    tokenAddr: E20TOKENADDR,
    lockInput: Object.assign({}, {
        from: ETHADDR,
        to: WANADDR,
        amount: '0.00113',
    }, ETH_PARA),
    redeemInput: WAN_PARA,
    revokeInput: ETH_PARA
}

const e20OutboundInput = {
    symbol: SYMBOL,
    tokenAddr: E20TOKENADDR,
    lockInput: Object.assign({}, {
        from: WANADDR,
        to: ETHADDR,
        amount: '0.05'
    }, WAN_PARA),
    redeemInput: ETH_PARA,
    revokeInput: WAN_PARA
}


module.exports = {
    e20InboundInput,
    e20OutboundInput,
    ethInboundInput,
    ethOutboundInput,
};