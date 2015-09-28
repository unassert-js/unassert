'use strict';

delete require.cache[require.resolve('..')];
var unassert = require('..');
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');

function testTransform (fixtureName, extraOptions) {
    it(fixtureName, function () {
        var fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
        var expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
        var ast = esprima.parse(fs.readFileSync(fixtureFilepath));
        // console.log(JSON.stringify(ast, null, 2));
        var modifiedAst = unassert(ast);
        var actual = escodegen.generate(modifiedAst);
        var expected = fs.readFileSync(expectedFilepath).toString();
        assert.equal(actual + '\n', expected);
    });
}

describe('unassert', function () {
    testTransform('func');
    testTransform('commonjs');
    testTransform('commonjs_singlevar');
    testTransform('commonjs_powerassert');
    testTransform('assignment');
    testTransform('assignment_singlevar');
});
