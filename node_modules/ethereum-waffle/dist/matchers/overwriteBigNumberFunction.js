"use strict";
exports.__esModule = true;
var ethers_1 = require("ethers");
var overwriteBigNumberFunction = function (functionName, readableName, _super, chaiUtils) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var actual = args[0];
    var expected = chaiUtils.flag(this, 'object');
    if (ethers_1.utils.BigNumber.isBigNumber(expected)) {
        this.assert(expected[functionName](actual), "Expected \"" + expected + "\" to be " + readableName + " " + actual, "Expected \"" + expected + "\" NOT to be " + readableName + " " + actual, expected, actual);
    }
    else if (ethers_1.utils.BigNumber.isBigNumber(actual)) {
        this.assert(actual[functionName](expected), "Expected \"" + expected + "\" to be " + readableName + " " + actual, "Expected \"" + expected + "\" NOT to be " + readableName + " " + actual, expected, actual);
    }
    else {
        _super.apply(this, args);
    }
}; };
exports["default"] = overwriteBigNumberFunction;
