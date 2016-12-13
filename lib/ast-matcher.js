'use strict';

var deepEqual = require('deep-equal');
var espurify = require('espurify');

function AstMatcher (signatureAst) {
    this.signatureAst = espurify(signatureAst);
    this.rootType = signatureAst.type;
}

AstMatcher.prototype.test = function (node) {
    if (!this.isSameRootType(node)) {
        return false;
    }
    return deepEqual(espurify(node), this.signatureAst);
};

AstMatcher.prototype.isSameRootType = function (node) {
    return node && node.type === this.rootType;
};

module.exports = AstMatcher;
