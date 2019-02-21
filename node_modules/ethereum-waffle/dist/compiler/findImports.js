"use strict";
exports.__esModule = true;
function findImports(sources) {
    return function (file) {
        var result = sources.find(function (importFile) { return importFile.url === file; });
        if (result) {
            return { contents: result.source };
        }
        return { error: "File not found: " + file };
    };
}
exports.findImports = findImports;
