'use strict';

var deepEqual = require('deep-equal');
var espurify = require('espurify');

function RequireMatcher (signatureAst) {
    this.signatureAst = signatureAst;
}

RequireMatcher.prototype.test = function (node) {
    if (!isAcceptableNode(node)) {
        return false;
    }
    var id, init;
    switch (node.type) {
    case 'VariableDeclarator':
        id = node.id;
        init = node.init;
        break;
    case 'AssignmentExpression':
        if (node.operator !== '=') {
            return false;
        }
        id = node.left;
        init = node.right;
        break;
    }
    return id && init &&
        deepEqual(espurify(id), this.signatureAst.left) &&
        deepEqual(espurify(init), this.signatureAst.right);
};

function isAcceptableNode (node) {
    return node && (node.type === 'VariableDeclarator' || node.type === 'AssignmentExpression');
}

module.exports = RequireMatcher;
