"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
var bufferToHex = function (buffer) {
    return Array
        .from(new Uint8Array(buffer))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
};
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
exports.concatenateBytes = function (bytes1, bytes2) {
    var bytes1Array = ethers_1.utils.arrayify(bytes1);
    var bytes2Array = ethers_1.utils.arrayify(bytes2);
    var concatenated = new Uint8Array(bytes1.length + bytes2.length);
    concatenated.set(bytes1);
    concatenated.set(bytes2, bytes1.length);
    return bufferToHex(concatenated);
};
