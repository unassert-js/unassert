import { unassertAst, createVisitor } from '../src/index.mjs';
import { strict as assert } from 'assert';
import { resolve, dirname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'acorn';
import { generate } from 'escodegen';
import { replace } from 'estraverse';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

function parseFixture (filepath) {
  return parse(readFileSync(filepath), { sourceType: 'module', ecmaVersion: '2022' });
}

function createFixture ({ code, postlude, prelude }) {
  return parse(prelude + '\n' + code + '\n' + postlude, { sourceType: 'module', ecmaVersion: '2022' });
}

function testWithGeneratedFixture (ext, code) {
  const preludeFilepath = resolve(__dirname, 'fixtures', ext, `prelude.${ext}`);
  const prelude = existsSync(preludeFilepath) ? readFileSync(preludeFilepath).toString() : '';
  const postludeFilepath = resolve(__dirname, 'fixtures', ext, `postlude.${ext}`);
  const postlude = readFileSync(postludeFilepath).toString();
  const expectedFilepath = resolve(__dirname, 'fixtures', ext, `expected.${ext}`);
  const expected = readFileSync(expectedFilepath).toString();

  it('unassertAst ' + code, function () {
    const ast = createFixture({ code, postlude, prelude });
    const modifiedAst = unassertAst(ast);
    const actual = generate(modifiedAst);
    assert.equal(actual + '\n', expected);
  });
  it('createVisitor ' + code, function () {
    const ast = createFixture({ code, postlude, prelude });
    const modifiedAst = replace(ast, createVisitor());
    const actual = generate(modifiedAst);
    assert.equal(actual + '\n', expected);
  });
}

describe('ESM', function () {
  function testESM (code) {
    testWithGeneratedFixture('mjs', code);
  }
  testESM("import assert from 'assert';");
  testESM("import assert from 'node:assert';");
  testESM("import assert from 'node:assert/strict';");
  testESM("import assert from 'assert/strict';");
  testESM("import * as assert from 'assert';");
  testESM("import * as assert from 'node:assert';");
  testESM("import * as assert from 'node:assert/strict';");
  testESM("import * as assert from 'assert/strict';");
  testESM("import { strict as assert } from 'assert';");
  testESM("import { strict as assert } from 'node:assert';");
});

describe('CJS', function () {
  function testCJS (code) {
    testWithGeneratedFixture('cjs', code);
  }
  testCJS("const assert = require('assert');");
  testCJS("const assert = require('assert').strict;");
  testCJS("const assert = require('assert/strict');");
  testCJS("const assert = require('node:assert');");
  testCJS("const assert = require('node:assert').strict;");
  testCJS("const assert = require('node:assert/strict');");
  testCJS("const { strict: assert } = require('assert');");
  testCJS("const { strict: assert } = require('node:assert');");
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
