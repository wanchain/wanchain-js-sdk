/**
 */

let config = require('./config.json');
let ccUtil = require("../../src/api/ccUtil");


module.exports = {
    getBtcTxForRedeem() {
        //{status: 'waitingX', chain: 'BTC'}
        return module.exports.getTxHistory({status: 'waitingX', chain: 'BTC'});
    },

    getBtcTxForRevoke() {
        //{status: 'waitingRevoke', chain: 'BTC'}
        return module.exports.getTxHistory({status: 'waitingRevoke', chain: 'BTC'});
    },

    getWbtcTxForRedeem() {
        //{status: 'waitingX', chain: 'WAN'}
        return module.exports.getTxHistory({status: 'waitingX', chain: 'WAN'});
    },

    getWbtcTxForRevoke() {
        //{status: 'waitingRevoke', chain: 'WAN'}
        return module.exports.getTxHistory({status: 'waitingRevoke', chain: 'WAN'});
    },

    getAllTransactions() {
        return module.exports.getTxHistory({});
    },

    getTxHistory(option) {
        return ccUtil.getBtcWanTxHistory(option);
    }
}
