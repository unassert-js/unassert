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

  function deftest (name, fun) {
    it(`${code} : ${name}`, () => {
      const ast = createFixture({ code, postlude, prelude });
      const modifiedAst = fun(ast);
      const actual = generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
  }
  deftest('unassertAst', (ast) => unassertAst(ast));
  deftest('createVisitor', (ast) => replace(ast, createVisitor()));
}

function testESM (code) {
  testWithGeneratedFixture('mjs', code);
}

function testCJS (code) {
  testWithGeneratedFixture('cjs', code);
}

function testWithFixture (fixtureName, options) {
  const fixtureFilepath = resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
  const expectedFilepath = resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
  const expected = readFileSync(expectedFilepath).toString();

  function deftest (name, fun) {
    it(`${fixtureName} : ${name}`, () => {
      const ast = parseFixture(fixtureFilepath);
      const modifiedAst = fun(ast);
      const actual = generate(modifiedAst);
      assert.equal(actual + '\n', expected);
    });
  }
  deftest('unassertAst', (ast) => unassertAst(ast, options));
  deftest('createVisitor', (ast) => replace(ast, createVisitor(options)));
}

describe('with default options', () => {
  testWithFixture('various_assertion_methods');
  testWithFixture('variable_declarator_singlevar');
  testWithFixture('assignment');
  testWithFixture('assignment_singlevar');
  testWithFixture('non_block_statement');

  describe('removal of ESM imports', () => {
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
    testESM("import { default as assert } from 'assert';");
    testESM("import { default as assert } from 'node:assert';");
  });

  describe('removal of CJS requires', () => {
    testCJS("const assert = require('assert');");
    testCJS("const assert = require('assert').strict;");
    testCJS("const assert = require('assert/strict');");
    testCJS("const assert = require('node:assert');");
    testCJS("const assert = require('node:assert').strict;");
    testCJS("const assert = require('node:assert/strict');");
    testCJS("const { strict: assert } = require('assert');");
    testCJS("const { strict: assert } = require('node:assert');");
  });
});

describe('with custom options', () => {
  testWithFixture('custom_modules_cjs', {
    modules: [
      'http-assert',
      'node:assert'
    ]
  });

  testWithFixture('custom_modules_mjs', {
    modules: [
      'node:assert',
      'node:assert/strict',
      'power-assert',
      'invariant',
      'nanoassert',
      'uvu/assert'
    ]
  });

  testWithFixture('not_an_expression_statement', {
    variables: [
      'isTrue'
    ]
  });
});
