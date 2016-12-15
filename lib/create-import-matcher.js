'use strict';

var acorn = require('acorn');
var espurify = require('espurify');
var AstMatcher = require('./ast-matcher');

module.exports = function (signatureStr) {
    var ast = acorn.parse(signatureStr, { sourceType:'module' });
    var decl = ast.body[0];
    return new AstMatcher(espurify(decl));
};
