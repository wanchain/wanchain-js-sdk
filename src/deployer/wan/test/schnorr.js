const crypto 			= require('crypto');
const BigInteger 	    = require('bigi');
const ecurve 			= require('ecurve');
const Web3EthAbi 	    = require('web3-eth-abi');
const  ecparams 	    = ecurve.getCurveByName('secp256k1');

// buffer
const r 			    = new Buffer("e7e59bebdcee876e84d03832544f5a517e96a9e3f60cd8f564bece6719d5af52", 'hex');
// buffer
let R					= baseScarMulti(r);

// sk*G
// return: buff
function baseScarMulti(sk) {
    let curvePt = ecparams.G.multiply(BigInteger.fromBuffer(sk));
    return curvePt.getEncoded(false);
}

// hash
// return:buffer
function h(buff) {
    let sha = crypto.createHash('sha256').update(buff).digest();
    return sha;
}

// get s
// s = r+sk*m
// return: buffer
function getSBuff(sk, m) {
    let rBig = BigInteger.fromBuffer(r);
    let skBig = BigInteger.fromBuffer(sk);
    let mBig = BigInteger.fromBuffer(m);
    let retBig;
    retBig = rBig.add(skBig.multiply(mBig).mod(ecparams.n)).mod(ecparams.n);
    return retBig.toBuffer(32);
}

// return: buffer
function computeM1(M) {
    let M1 = h(M);
    return M1;
}

// compute m
// M1=hash(M)
// m=hash(M1||R)
// M: buffer
// R: buffer
// return: buffer
function computem(M1, R) {
    let list = [];
    list.push(M1);
    list.push(R);
    // hash(M1||R)
    let m = Buffer.concat(list);
    return h(m)
}

//typesArray:['uint256','string']
//parameters: ['2345675643', 'Hello!%']
//return : buff
function computeM(typesArray, parameters) {
    let mStrHex = Web3EthAbi.encodeParameters(typesArray, parameters);
    return new Buffer(mStrHex.substring(2), 'hex');
}

// return : hexString
function getR() {
    return "0x" + R.toString('hex');
}

// return: hexString
function bufferToHexString(buff) {
    return "0x" + buff.toString('hex');
}

// sk: buff
// return: hexString
function getPKBySk(sk) {
    return bufferToHexString(baseScarMulti(sk));
}

//typesArray:['uint256','string']
//parameters: ['2345675643', 'Hello!%']
//return :hexString
function getS(sk, typesArray, parameters) {
    let MBuff = computeM(typesArray, parameters);
    let M1Buff = computeM1(MBuff);
    let mBuff = computem(M1Buff, R);
    let sBuff = getSBuff(sk, mBuff);
    return bufferToHexString(sBuff);
}

module.exports = {
    getS: getS,
    getPKBySk: getPKBySk,
    getR: getR
};