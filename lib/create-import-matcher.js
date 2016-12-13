'use strict';

var esprima = require('esprima');
var espurify = require('espurify');
var AstMatcher = require('./ast-matcher');

module.exports = function (signatureStr) {
    var ast = esprima.parse(signatureStr, { sourceType:'module' });
    var decl = ast.body[0];
    return new AstMatcher(espurify(decl));
};
