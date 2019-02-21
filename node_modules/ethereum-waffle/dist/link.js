"use strict";
exports.__esModule = true;
var ethers_1 = require("ethers");
function linkSolidity4(contract, libraryName, libraryAddress) {
    var address = libraryAddress.replace('0x', '');
    var libraryNamePrefix = libraryName.slice(0, 36);
    var pattern = new RegExp("_+" + libraryNamePrefix + "_+", 'g');
    if (!pattern.exec(contract.evm.bytecode.object)) {
        throw new Error("Can't link '" + libraryName + "'.");
    }
    contract.evm.bytecode.object = contract.evm.bytecode.object.replace(pattern, address);
}
exports.linkSolidity4 = linkSolidity4;
function linkSolidity5(contract, libraryName, libraryAddress) {
    var address = libraryAddress.replace('0x', '');
    var encodedLibraryName = ethers_1.utils
        .solidityKeccak256(['string'], [libraryName])
        .slice(2, 36);
    var pattern = new RegExp("_+\\$" + encodedLibraryName + "\\$_+", 'g');
    var bytecode = contract.evm.bytecode.object;
    if (!pattern.exec(bytecode)) {
        throw new Error("Can't link '" + libraryName + "'.");
    }
    contract.evm.bytecode.object = bytecode.replace(pattern, address);
}
exports.linkSolidity5 = linkSolidity5;
