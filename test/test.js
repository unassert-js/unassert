'use strict';

delete require.cache[require.resolve('..')];
var unassert = require('..');
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');


describe('default behavior', function () {
    function testTransform (fixtureName) {
        var fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
        var expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
        var expected = fs.readFileSync(expectedFilepath).toString();

        it('unassert ' + fixtureName, function () {
            var ast = esprima.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
            var modifiedAst = unassert(ast);
            var actual = escodegen.generate(modifiedAst);
            assert.equal(actual + '\n', expected);
        });
        it('unassert.createVisitor ' + fixtureName, function () {
            var ast = esprima.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
            var modifiedAst = estraverse.replace(ast, unassert.createVisitor());
            var actual = escodegen.generate(modifiedAst);
            assert.equal(actual + '\n', expected);
        });
    }

    testTransform('func');
    testTransform('commonjs');
    testTransform('commonjs_singlevar');
    testTransform('commonjs_powerassert');
    testTransform('assignment');
    testTransform('assignment_singlevar');
    testTransform('es6module');
    testTransform('es6module_powerassert');
    testTransform('es6module_namespece');
    testTransform('not_an_expression_statement');
    testTransform('non_block_statement');
});


describe('with options', function () {
    function testWithCustomization (fixtureName, extraOptions) {
        var fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
        var expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
        var expected = fs.readFileSync(expectedFilepath).toString();

        it('unassert.createVisitor ' + fixtureName, function () {
            var ast = esprima.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
            var modifiedAst = estraverse.replace(ast, unassert.createVisitor(extraOptions));
            var actual = escodegen.generate(modifiedAst);
            assert.equal(actual + '\n', expected);
        });
    }

    testWithCustomization('customization_httpassert', {
        assertionPatterns: [
            'ok(actual, [message])',
            'assert(value, status, [msg], [opts])'
        ],
        declarationPatterns: [
            'var assert = require("http-assert")',
            'var ok = require("assert")'
        ]
    });

    testWithCustomization('func', {
        assertionPatterns: [
            'ok(actual, [message])',
            'assert(value, status, [msg], [opts])',
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
        declarationPatterns: [
            'var assert = require("http-assert")',
            'var ok = require("assert")',
            'import assert from "assert"',
            'import * as assert from "assert"',
            'var assert = require("assert")',
            'import assert from "power-assert"',
            'import * as assert from "power-assert"',
            'var assert = require("power-assert")'
        ]
    });
});
