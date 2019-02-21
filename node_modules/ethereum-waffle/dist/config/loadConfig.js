"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var path_1 = __importDefault(require("path"));
var config_1 = __importDefault(require("./config"));
function readConfigFile(configPath) {
    if (configPath) {
        return require(path_1["default"].join(process.cwd(), configPath));
    }
    return {};
}
function loadConfig(configPath) {
    return __assign({}, config_1["default"], readConfigFile(configPath));
}
exports.loadConfig = loadConfig;
