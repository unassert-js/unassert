import { unassertAst, createVisitor } from '../src/index.mjs';
import { strict as assert } from 'assert';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
import { parse } from 'acorn';
import { generate } from 'escodegen';
import { replace } from 'estraverse';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

function parseFixture (filepath) {
  return parse(readFileSync(filepath), { sourceType: 'module', ecmaVersion: '2022' });
}

describe('default behavior (with default options)', function () {
  function testTransform (fixtureName) {
    const fixtureFilepath = resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
    const expectedFilepath = resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
    const expected = readFileSync(expectedFilepath).toString();

    it('unassertAst ' + fixtureName, function () {
      const ast = parseFixture(fixtureFilepath);
      const modifiedAst = unassertAst(ast);
      const actual = generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
    it('createVisitor ' + fixtureName, function () {
      const ast = parseFixture(fixtureFilepath);
      const modifiedAst = replace(ast, createVisitor());
      const actual = generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
  }

  testTransform('func');
  testTransform('commonjs');
  testTransform('commonjs_singlevar');
  testTransform('assignment');
  testTransform('assignment_singlevar');
  testTransform('es6module');
  testTransform('es6module_namespece');
  testTransform('not_an_expression_statement');
  testTransform('non_block_statement');
});

describe('with customized options', function () {
  function testWithCustomization (fixtureName, options) {
    const fixtureFilepath = resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
    const expectedFilepath = resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
    const expected = readFileSync(expectedFilepath).toString();

    it('unassertAst ' + fixtureName, function () {
      const ast = parseFixture(fixtureFilepath);
      const modifiedAst = unassertAst(ast, options);
      const actual = generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
    it('createVisitor ' + fixtureName, function () {
      const ast = parseFixture(fixtureFilepath);
      const modifiedAst = replace(ast, createVisitor(options));
      const actual = generate(modifiedAst);
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

  testWithCustomization('customization_powerassert_cjs', {
    variables: [
      'assert'
    ],
    modules: [
      'power-assert'
    ]
  });

  testWithCustomization('customization_powerassert_esm', {
    variables: [
      'assert'
    ],
    modules: [
      'power-assert'
    ]
  });

  testWithCustomization('customization_various_modules', {
    variables: [
      'assert',
      'invariant',
      'nassert',
      'uassert'
    ],
    modules: [
      'assert',
      'node:assert',
      'invariant',
      'nanoassert',
      'uvu/assert'
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
