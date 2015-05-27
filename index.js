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
var escallmatch = require('escallmatch');
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

function matches (node) {
    return function (matcher) {
        return matcher.test(node);
    };
}

function parentPath (controller) {
    return controller.path().slice(0, -1).join('/');
}

module.exports = function unassert (ast, options) {
    var pathToRemove = {};
    estraverse.replace(ast, {
        enter: function (currentNode, parentNode) {
            if (matchers.some(matches(currentNode))) {
                pathToRemove[parentPath(this)] = true;
                this.skip();
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
