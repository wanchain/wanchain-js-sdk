'use strict'

// https://github.com/satoshilabs/slips/blob/master/slip-0044.md

const config = {
  chainMap: new Map([
    // ["eth", {version: 0x01, id: 0x8000003c, accountFormat: "hex", accountPrefix: "0x"}],
    ["btc", {version: 0x01, id: 0x80000000, accountFormat: "ascii", accountPrefix: ""}],
    ["eos", {version: 0x01, id: 0x800000c2, accountFormat: "ascii", accountPrefix: ""}],
  ]),   
  formatSet: new Set([
    "hex",
    "ascii",
  ]),
};

module.exports = config;