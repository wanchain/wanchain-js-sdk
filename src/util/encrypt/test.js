'use strict'

const crossChainAccount = require('./crossAccountEncrypt');

let wanAccout = "";

// eth
const ethAccount = new crossChainAccount("eth");

// console.log("eth: 0x514910771AF9Ca656af840dff83E8264EcF986CA");
// wanAccout = ethAccount.encodeAccount("0x514910771AF9Ca656af840dff83E8264EcF986CA");
// console.log(wanAccout);
// console.log(ethAccount.decodeAccount(wanAccout));

// eos
const eosAccount = new crossChainAccount("eos");

// token
console.log("eosio: eosio.token:EOS:4");
wanAccout = eosAccount.encodeAccount("eosio.token:EOS:4");
console.log(wanAccout);
console.log(eosAccount.decodeAccount(wanAccout));

console.log("eosio: eosio.token:NS:0");
wanAccout = eosAccount.encodeAccount("eosio.token:NS:0");
console.log(wanAccout);
console.log(eosAccount.decodeAccount(wanAccout));

console.log("eosio: eosio.token:EWAN:3");
wanAccout = eosAccount.encodeAccount("eosio.token:EWAN:3");
console.log(wanAccout);
console.log(eosAccount.decodeAccount(wanAccout));

console.log("eosio: wanchainhtlc");
wanAccout = eosAccount.encodeAccount("wanchainhtlc");
console.log(wanAccout);
console.log(eosAccount.decodeAccount(wanAccout));

// //htlc
// console.log("eosio: htlceos");
// wanAccout = eosAccount.encodeAccount("htlceos");
// console.log(wanAccout);
// console.log(eosAccount.decodeAccount(wanAccout));

// //storeman
// console.log("eosio: storeman");
// wanAccout = eosAccount.encodeAccount("storeman");
// console.log(wanAccout);
// console.log(eosAccount.decodeAccount(wanAccout));

// //storeman
// console.log("eosio: user");
// wanAccout = eosAccount.encodeAccount("user");
// console.log(wanAccout);
// console.log(eosAccount.decodeAccount(wanAccout));