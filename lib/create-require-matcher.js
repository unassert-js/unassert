'use strict';

var acorn = require('acorn');
var espurify = require('espurify');
var RequireMatcher = require('./require-matcher');

function extractAssignmentExpressionFrom (tree) {
    var statement = (tree.type === 'Program') ? tree.body[0] : tree;
    var expression;
    if (statement.type !== 'ExpressionStatement') {
        throw new Error('Argument should be in the form of expression');
    }
    expression = statement.expression;
    if (expression.type !== 'AssignmentExpression') {
        throw new Error('Argument should be in the form of assignment');
    }
    return expression;
}

module.exports = function (signatureStr) {
    var signatureAst = acorn.parse(signatureStr, { sourceType:'module' });
    var assignment = extractAssignmentExpressionFrom(signatureAst);
    return new RequireMatcher(espurify(assignment));
};
