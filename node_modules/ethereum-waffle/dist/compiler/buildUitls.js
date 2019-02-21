"use strict";
exports.__esModule = true;
function buildSourcesObject(files) {
    var result = {};
    files.map(function (file) { return result[file.url] = { content: file.source }; });
    return result;
}
exports.buildSourcesObject = buildSourcesObject;
function buildInputObject(files, remappings) {
    var sources = buildSourcesObject(files);
    return {
        language: 'Solidity',
        sources: sources,
        settings: {
            remappings: remappings,
            outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] } }
        }
    };
}
exports.buildInputObject = buildInputObject;
