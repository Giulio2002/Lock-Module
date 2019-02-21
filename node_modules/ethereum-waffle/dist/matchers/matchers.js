"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var overwriteBigNumberFunction_1 = __importDefault(require("./overwriteBigNumberFunction"));
var utils_1 = require("ethers/utils");
var utils_2 = require("../utils");
var solidity = function (chai, utils) {
    var Assertion = chai.Assertion;
    Assertion.overwriteMethod('equal', function (_super) { return overwriteBigNumberFunction_1["default"]('eq', 'equal', _super, utils); });
    Assertion.overwriteMethod('eq', function (_super) { return overwriteBigNumberFunction_1["default"]('eq', 'equal', _super, utils); });
    Assertion.overwriteMethod('above', function (_super) { return overwriteBigNumberFunction_1["default"]('gt', 'above', _super, utils); });
    Assertion.overwriteMethod('below', function (_super) { return overwriteBigNumberFunction_1["default"]('lt', 'below', _super, utils); });
    Assertion.overwriteMethod('least', function (_super) { return overwriteBigNumberFunction_1["default"]('gte', 'at least', _super, utils); });
    Assertion.overwriteMethod('most', function (_super) { return overwriteBigNumberFunction_1["default"]('lte', 'at most', _super, utils); });
    Assertion.addProperty('reverted', function () {
        var _this = this;
        /* eslint-disable no-underscore-dangle */
        var promise = this._obj;
        var derivedPromise = promise.then(function (value) {
            _this.assert(false, 'Expected transaction to be reverted', 'Expected transaction NOT to be reverted', 'not reverted', 'reverted');
            return value;
        }, function (reason) {
            var isReverted = reason.toString().search('revert') >= 0;
            var isThrown = reason.toString().search('invalid opcode') >= 0;
            _this.assert(isReverted || isThrown, "Expected transaction to be reverted, but other exception was thrown: " + reason, 'Expected transaction NOT to be reverted', 'Reverted', reason);
            return reason;
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        return this;
    });
    Assertion.addMethod('revertedWith', function (revertReason) {
        var _this = this;
        /* eslint-disable no-underscore-dangle */
        var promise = this._obj;
        var derivedPromise = promise.then(function (value) {
            _this.assert(false, 'Expected transaction to be reverted', 'Expected transaction NOT to be reverted', 'not reverted', 'reverted');
            return value;
        }, function (reason) {
            var isReverted = reason.toString().search('revert') >= 0 && reason.toString().search(revertReason) >= 0;
            var isThrown = reason.toString().search('invalid opcode') >= 0 && revertReason === '';
            _this.assert(isReverted || isThrown, "Expected transaction to be reverted with " + revertReason + ", but other exception was thrown: " + reason, "Expected transaction NOT to be reverted with " + revertReason, 'Reverted', reason);
            return reason;
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        return this;
    });
    var filterLogsWithTopics = function (logs, topic) {
        return logs.filter(function (log) { return log.topics.includes(topic); });
    };
    Assertion.addMethod('emit', function (contract, eventName) {
        var _this = this;
        /* eslint-disable no-underscore-dangle */
        var promise = this._obj;
        var derivedPromise = promise.then(function (tx) {
            return contract.provider.getTransactionReceipt(tx.hash);
        }).then(function (receipt) {
            var topic = contract.interface.events[eventName].topic;
            _this.logs = filterLogsWithTopics(receipt.logs, topic);
            if (_this.logs.length < 1) {
                _this.assert(false, "Expected event \"" + eventName + "\" to emitted, but wasn't", "Expected event \"" + eventName + "\" NOT to emitted, but it was", eventName, '');
            }
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        this.promise = derivedPromise;
        this.contract = contract;
        this.eventName = eventName;
        return this;
    });
    var assertArgsArraysEqual = function (context, expectedArgs, actualArgs) {
        context.assert(actualArgs.length === expectedArgs.length, "Expected \"" + context.eventName + "\" event to have " + expectedArgs.length + " argument(s), " +
            ("but has " + actualArgs.length), "Do not combine .not. with .withArgs()", expectedArgs.length, actualArgs.length);
        for (var index = 0; index < expectedArgs.length; index++) {
            new chai.Assertion(expectedArgs[index]).equal(actualArgs[index]);
        }
    };
    Assertion.addMethod('withArgs', function () {
        var _this = this;
        var expectedArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            expectedArgs[_i] = arguments[_i];
        }
        var derivedPromise = this.promise.then(function () {
            var actualArgs = _this.contract.interface.parseLog(_this.logs[0]);
            assertArgsArraysEqual(_this, expectedArgs, actualArgs.values);
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        return this;
    });
    Assertion.addProperty('properAddress', function () {
        /* eslint-disable no-underscore-dangle */
        var subject = this._obj;
        this.assert(/^0x[0-9-a-fA-F]{40}$/.test(subject), "Expected \"" + subject + "\" to be a proper address", "Expected \"" + subject + "\" not to be a proper address", 'proper address (eg.: 0x1234567890123456789012345678901234567890)', subject);
    });
    Assertion.addProperty('properPrivateKey', function () {
        /* eslint-disable no-underscore-dangle */
        var subject = this._obj;
        this.assert(/^0x[0-9-a-fA-F]{64}$/.test(subject), "Expected \"" + subject + "\" to be a proper private key", "Expected \"" + subject + "\" not to be a proper private key", 'proper address (eg.: 0x1234567890123456789012345678901234567890)', subject);
    });
    Assertion.addMethod('properHex', function (length) {
        /* eslint-disable no-underscore-dangle */
        var subject = this._obj;
        var regexp = new RegExp("^0x[0-9-a-fA-F]{" + length + "}$");
        this.assert(regexp.test(subject), "Expected \"" + subject + "\" to be a proper hex of length " + length, "Expected \"" + subject + "\" not to be a proper hex of length " + length + ", but it was", 'proper address (eg.: 0x1234567890123456789012345678901234567890)', subject);
    });
    Assertion.addMethod('changeBalance', function (wallet, balanceChange) {
        var _this = this;
        var subject = this._obj;
        if (typeof subject !== 'function') {
            throw new Error("Expect subject should be a callback returning the Promise\n        e.g.: await expect(() => wallet.send({to: '0xb', value: 200})).to.changeBalance('0xa', -200)");
        }
        var derivedPromise = utils_2.getBalanceChange(subject, wallet)
            .then(function (actualChange) {
            _this.assert(actualChange.eq(utils_1.bigNumberify(balanceChange)), "Expected \"" + wallet.address + "\" to change balance by " + balanceChange + " wei, " +
                ("but it has changed by " + actualChange + " wei"), "Expected \"" + wallet.address + "\" to not change balance by " + balanceChange + " wei,", balanceChange, actualChange);
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        this.promise = derivedPromise;
        return this;
    });
    Assertion.addMethod('changeBalances', function (wallets, balanceChanges) {
        var _this = this;
        var subject = this._obj;
        if (typeof subject !== 'function') {
            throw new Error("Expect subject should be a callback returning the Promise\n        e.g.: await expect(() => wallet.send({to: '0xb', value: 200})).to.changeBalances(['0xa', '0xb'], [-200, 200])");
        }
        var derivedPromise = utils_2.getBalanceChanges(subject, wallets)
            .then(function (actualChanges) {
            var walletsAddresses = wallets.map(function (wallet) { return wallet.address; });
            _this.assert(actualChanges.every(function (change, ind) { return change.eq(utils_1.bigNumberify(balanceChanges[ind])); }), "Expected " + walletsAddresses + " to change balance by " + balanceChanges + " wei, " +
                ("but it has changed by " + actualChanges + " wei"), "Expected " + walletsAddresses + " to not change balance by " + balanceChanges + " wei,", balanceChanges.map(function (balanceChange) { return balanceChange.toString(); }), actualChanges.map(function (actualChange) { return actualChange.toString(); }));
        });
        this.then = derivedPromise.then.bind(derivedPromise);
        this["catch"] = derivedPromise["catch"].bind(derivedPromise);
        this.promise = derivedPromise;
        return this;
    });
};
exports["default"] = solidity;
