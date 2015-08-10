/**
 * unassert
 *   Remove assertions from AST to encourage Design by Contract (DbC)
 * 
 * https://github.com/twada/unassert
 *
 * Copyright (c) 2015 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var estraverse = require('estraverse');
var syntax = estraverse.Syntax;
var escallmatch = require('escallmatch');
var espurify = require('espurify');
var esprima = require('esprima');
var deepEqual = require('deep-equal');
var patterns = [
    'assert(value, [message])',
    'assert.ok(value, [message])',
    'assert.equal(actual, expected, [message])',
    'assert.notEqual(actual, expected, [message])',
    'assert.strictEqual(actual, expected, [message])',
    'assert.notStrictEqual(actual, expected, [message])',
    'assert.deepEqual(actual, expected, [message])',
    'assert.notDeepEqual(actual, expected, [message])',
    'assert.deepStrictEqual(actual, expected, [message])',
    'assert.notDeepStrictEqual(actual, expected, [message])',
    'assert.fail(actual, expected, message, operator)',
    'assert.throws(block, [error], [message])',
    'assert.doesNotThrow(block, [message])',
    'assert.ifError(value)',
    'console.assert(value, [message])'
];
var matchers = patterns.map(escallmatch);

var declarationPatterns = [
    'var assert = require("assert")'
];
var declarationMatchers = [];
declarationPatterns.forEach(function (dcl) {
    var ast = esprima.parse(dcl, { sourceType:'module' });
    var body0 = ast.body[0];
    if (body0.type === syntax.VariableDeclaration) {
        declarationMatchers.push(espurify(body0.declarations[0]));
    }
});

function matches (node) {
    return function (matcher) {
        return matcher.test(node);
    };
}

function equivalentTree (node) {
    return function (example) {
        return deepEqual(espurify(node), example);
    };
}

module.exports = function unassert (ast, options) {
    var pathToRemove = {};
    estraverse.replace(ast, {
        enter: function (currentNode, parentNode) {
            var espathToRemove;
            switch (currentNode.type) {
            case syntax.VariableDeclarator:
                if (declarationMatchers.some(equivalentTree(currentNode))) {
                    if (parentNode.declarations.length === 1) {
                        // body/1/declarations/0 -> body/1
                        espathToRemove = this.path().slice(0, -2).join('/');
                    } else {
                        // single var pattern
                        espathToRemove = this.path().join('/');
                    }
                    pathToRemove[espathToRemove] = true;
                    this.skip();
                }
                break;
            case syntax.CallExpression:
                if (matchers.some(matches(currentNode))) {
                    // body/1/body/body/0/expression -> body/1/body/body/0
                    espathToRemove = this.path().slice(0, -1).join('/');
                    pathToRemove[espathToRemove] = true;
                    this.skip();
                }
                break;
            }
        },
        leave: function (currentNode, parentNode) {
            if (this.path() && pathToRemove[this.path().join('/')]) {
                this.remove();
            }
        }
    });
    return ast;
};
