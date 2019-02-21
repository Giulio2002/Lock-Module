"use strict";
exports.__esModule = true;
var compileSolcjs_1 = require("./compileSolcjs");
var compileNative_1 = require("./compileNative");
var compileDocker_1 = require("./compileDocker");
function getCompileFunction(config) {
    if (config.compiler === 'native') {
        return compileNative_1.compileNative(config);
    }
    else if (config.compiler === 'dockerized-solc') {
        return compileDocker_1.compileDocker(config);
    }
    else if (config.compiler === 'solcjs' || !config.compiler) {
        return compileSolcjs_1.compileSolcjs(config);
    }
    throw new Error("Unknown compiler " + config.compiler);
}
exports.getCompileFunction = getCompileFunction;
