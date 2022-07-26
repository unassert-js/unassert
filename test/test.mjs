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

function testWithFixture (ext, fixtureName) {
  const fixtureFilepath = resolve(__dirname, 'fixtures', ext, `${fixtureName}.${ext}`);
  const expectedFilepath = resolve(__dirname, 'fixtures', ext, `expected.${ext}`);
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

describe('ESM', function () {
  function testESM (fixtureName) {
    testWithFixture('mjs', fixtureName);
  }
  testESM('import_default_specifier');
  testESM('import_default_specifier_node_protocol');
  testESM('import_default_specifier_slash_strict');
  testESM('import_default_specifier_node_protocol_slash_strict');
  testESM('import_namespace_specifier');
  testESM('import_namespace_specifier_node_protocol');
  testESM('import_namespace_specifier_slash_strict');
  testESM('import_namespace_specifier_node_protocol_slash_strict');
  testESM('import_specifier_strict');
  testESM('import_specifier_strict_node_protocol');
});

describe('CJS', function () {
  function testCJS (fixtureName) {
    testWithFixture('cjs', fixtureName);
  }
  testCJS('require_assert');
  testCJS('require_assert_dot_strict');
  testCJS('require_assert_slash_strict');
  testCJS('require_node_assert');
  testCJS('require_node_assert_dot_strict');
  testCJS('require_node_assert_slash_strict');
});

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

  testTransform('various_assertion_methods');
  testTransform('commonjs_singlevar');
  testTransform('assignment');
  testTransform('assignment_singlevar');
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
});
