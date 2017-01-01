'use strict';

var acorn = require('acorn');
var espurify = require('espurify');
var CallMatcher = require('call-matcher');

function extractCallExpressionFrom (tree) {
    var statement = tree.body[0];
    if (statement.type !== 'ExpressionStatement') {
        throw new Error('Argument should be in the form of CallExpression');
    }
    return statement.expression;
}

module.exports = function (signatureStr) {
    var signatureAst = acorn.parse(signatureStr, { sourceType: 'module' });
    var callexpr = extractCallExpressionFrom(signatureAst);
    return new CallMatcher(espurify(callexpr));
};
