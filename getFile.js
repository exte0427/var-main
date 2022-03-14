"use strict";
exports.__esModule = true;
exports.var_main = void 0;
var fs = require("fs");
var path = require("path");
var nowPath = process.cwd();
var var_main;
(function (var_main) {
    var_main.getCode = function () {
        return fs.readFileSync(path.join(nowPath, "node_modules", "var-main", "var.js"), "utf8");
    };
})(var_main = exports.var_main || (exports.var_main = {}));
