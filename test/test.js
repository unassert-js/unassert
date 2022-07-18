'use strict';

delete require.cache[require.resolve('..')];
const unassert = require('..');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const acorn = require('acorn');
const escodegen = require('escodegen');
const estraverse = require('estraverse');

describe('default behavior', function () {
  function testTransform (fixtureName) {
    const fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
    const expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
    const expected = fs.readFileSync(expectedFilepath).toString();

    it('unassert ' + fixtureName, function () {
      const ast = acorn.parse(fs.readFileSync(fixtureFilepath), { sourceType: 'module' });
      const modifiedAst = unassert(ast);
      const actual = escodegen.generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
    it('unassert.createVisitor ' + fixtureName, function () {
      const ast = acorn.parse(fs.readFileSync(fixtureFilepath), { sourceType: 'module' });
      const modifiedAst = estraverse.replace(ast, unassert.createVisitor());
      const actual = escodegen.generate(modifiedAst);
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
    const fixtureFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
    const expectedFilepath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
    const expected = fs.readFileSync(expectedFilepath).toString();

    it('unassert.createVisitor ' + fixtureName, function () {
      const ast = acorn.parse(fs.readFileSync(fixtureFilepath), { sourceType: 'module' });
      const modifiedAst = estraverse.replace(ast, unassert.createVisitor(extraOptions));
      const actual = escodegen.generate(modifiedAst);
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
