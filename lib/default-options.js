'use strict';

module.exports = function defaultOptions () {
    return {
        assertionPatterns: [
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
        ],
        requirePatterns: [
            'assert = require("assert")',
            'assert = require("power-assert")'
        ],
        importPatterns: [
            'import assert from "assert"',
            'import * as assert from "assert"',
            'import assert from "power-assert"',
            'import * as assert from "power-assert"'
        ]
    };
};
