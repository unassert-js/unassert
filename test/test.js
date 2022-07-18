'use strict';

delete require.cache[require.resolve('..')];
var unassert = require('..');
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var acorn = require('acorn');
var escodegen = require('escodegen');
var estraverse = require('estraverse');


describe('default behavior', function () {
    function testTransform (fixtureName) {
        var fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
        var expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
        var expected = fs.readFileSync(expectedFilepath).toString();

        it('unassert ' + fixtureName, function () {
            var ast = acorn.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
            var modifiedAst = unassert(ast);
            var actual = escodegen.generate(modifiedAst);
            assert.equal(actual + '\n', expected);
        });
        it('unassert.createVisitor ' + fixtureName, function () {
            var ast = acorn.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
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
            var ast = acorn.parse(fs.readFileSync(fixtureFilepath),  { sourceType: 'module' });
            var modifiedAst = estraverse.replace(ast, unassert.createVisitor(extraOptions));
            var actual = escodegen.generate(modifiedAst);
            assert.equal(actual + '\n', expected);
        });
    }

    testWithCustomization('customization_httpassert', {
        variables: [
            'assert',
            'ok'
        ],
        modules: [
            'assert',
            'http-assert'
        ]
    });

    testWithCustomization('func', {
        variables: [
            'assert'
        ],
        modules: [
            'assert',
            'power-assert',
            'node:assert'
        ]
    });
});
