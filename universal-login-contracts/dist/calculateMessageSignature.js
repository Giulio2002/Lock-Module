"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
exports.calculateMessageHash = function (msg) {
    var dataHash = ethers_1.utils.solidityKeccak256(['bytes'], [msg.data]);
    return ethers_1.utils.solidityKeccak256(['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint', 'address', 'uint', 'uint'], [msg.from, msg.to, msg.value, dataHash, msg.nonce, msg.gasPrice, msg.gasToken, msg.gasLimit, msg.operationType]);
};
exports.calculateMessageSignature = function (privateKey, msg) {
    var wallet = new ethers_1.Wallet(privateKey);
    var massageHash = exports.calculateMessageHash(msg);
    var signed = wallet.signMessage(ethers_1.utils.arrayify(massageHash));
    return signed;
};
