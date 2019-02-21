"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function findInputs(sourcePath) {
    var stack = [sourcePath];
    var inputFiles = [];
    while (stack.length > 0) {
        var dir = stack.pop();
        var files = fs_1["default"].readdirSync(dir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var filePath = path_1["default"].join(dir, file);
            if (isDirectory(filePath)) {
                stack.push(filePath);
            }
            else if (file.endsWith('.sol')) {
                inputFiles.push(filePath);
            }
        }
    }
    return inputFiles;
}
exports.findInputs = findInputs;
var isDirectory = function (filePath) {
    return fs_1["default"].existsSync(filePath) &&
        fs_1["default"].statSync(filePath).isDirectory();
};
