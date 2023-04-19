### [2.0.2](https://github.com/unassert-js/unassert/releases/tag/v2.0.2) (2023-04-20)

#### Bug Fixes

* [Ensure tooling can access package.json](https://github.com/unassert-js/unassert/pull/46) by [@ljharb](https://github.com/ljharb)


### [2.0.1](https://github.com/unassert-js/unassert/releases/tag/v2.0.1) (2023-04-19)

#### Bug Fixes

* [Fix "exports" for node 13.0-13.6](https://github.com/unassert-js/unassert/pull/41) by [@ljharb](https://github.com/ljharb)


## [2.0.0](https://github.com/unassert-js/unassert/releases/tag/v2.0.0) (2022-08-01)


#### Features

* Variable Tracking
  * [Variable Tracking: remove assertion calls based on their imported variable names](https://github.com/unassert-js/unassert/pull/34)

* Restructured codebase
  * [Migrate codebase to ESM and provide CJS/ESM dual package](https://github.com/unassert-js/unassert/pull/29)
  * [Replace default exported `unassert` with named exported `unassertAst`](https://github.com/unassert-js/unassert/pull/27)

* Performance improvement
  * [Replace AST matcher with simpler and robust logic](https://github.com/unassert-js/unassert/pull/25)
  * [Add Benchmark Suite to run benchmark continuously](https://github.com/unassert-js/unassert/pull/39)
  * v2.0.0 is 20 times faster than v1.6.0

* Newly supported syntaxes and features
  * [Support strict assertion mode newly exposed as 'node:assert/strict'](https://github.com/unassert-js/unassert/pull/31)
  * [Support destructured assignment of strict property](https://github.com/unassert-js/unassert/pull/32)
  * [Support safe removal of loop invariants in for-of statement](https://github.com/unassert-js/unassert/pull/35)
  * [Support removal of async assertion such as `assert.rejects`](https://github.com/unassert-js/unassert/pull/36)


#### Bug Fixes

* [unassert causes SyntaxError when body of LabeledStatement is single ExpressionStatement](https://github.com/unassert-js/unassert/pull/37)


#### Breaking Changes

* [Replace default exported `unassert` with named exported `unassertAst`](https://github.com/unassert-js/unassert/pull/27)

`unassert` function is removed in favor of named exports aiming ESM era. Please use `unassert.unassertAst` instead.

before:
```js
const unassert = require('unassert');
```

after:
```js
const { unassertAst } = require('unassert');
```


* [Replace AST matcher with simpler and robust logic](https://github.com/unassert-js/unassert/pull/25)

Configuration options are simplified a lot. Patterns are aggregated into `modules`.

before:
```js
{
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
    'assert = require("assert")'
  ],
  importPatterns: [
    'import assert from "assert"',
    'import * as assert from "assert"'
  ]
}
```

after:
```js
{
  modules: [
    'assert',
    'assert/strict',
    'node:assert',
    'node:assert/strict'
  ]
}
```


* [Drop power-assert support from default patterns since power-assert works transparently](https://github.com/unassert-js/unassert/pull/28)

Move power-assert support away from default patterns since power-assert empowers default assert function transparently, so should not be required explicitly. If power-assert is still required explicitly, add 'power-assert' to `modules` in customized configuration.

after:
```js
{
  modules: [
    'assert',
    'assert/strict',
    'node:assert',
    'node:assert/strict',
    'power-assert'
  ]
}
```


## [1.6.0](https://github.com/unassert-js/unassert/releases/tag/v1.6.0) (2019-09-20)

#### Chores

* [Dependency cleanup and updates](https://github.com/unassert-js/unassert/pull/15) by [@goto-bus-stop](https://github.com/goto-bus-stop)


### [1.5.1](https://github.com/unassert-js/unassert/releases/tag/v1.5.1) (2017-01-01)


#### Chores

* switch to call-matcher ([de4172d](https://github.com/unassert-js/unassert/commit/de4172d532fc5edcabcdc5365ed310af118d88e1))


## [1.5.0](https://github.com/unassert-js/unassert/releases/tag/v1.5.0) (2016-12-19)


#### Features

* [Expose `createVisitor` to make assertion and declaration patterns configurable](https://github.com/unassert-js/unassert/pull/9)
* transfer to unassert-js organization ([39164de5](https://github.com/unassert-js/unassert/commit/39164de555ee88c00b01085b9244029ff53f319b))


### [1.4.1](https://github.com/unassert-js/unassert/releases/tag/v1.4.1) (2016-07-22)


#### Bug Fixes

* [Add empty block if parent is non-block statement](https://github.com/unassert-js/unassert/pull/8)


## [1.4.0](https://github.com/unassert-js/unassert/releases/tag/v1.4.0) (2016-05-02)


#### Features

* [Support ImportNamespaceSpecifier](https://github.com/unassert-js/unassert/pull/6)


### [1.3.1](https://github.com/unassert-js/unassert/releases/tag/v1.3.1) (2015-12-08)


#### Bug Fixes

  * remove assertion if and only if its parent is an ExpressionStatement ([6515857a](https://github.com/unassert-js/unassert/commit/6515857a28f96ac6de9a92eeeb97629210c239eb), closes [#4](https://github.com/unassert-js/unassert/issues/4))


## [1.3.0](https://github.com/unassert-js/unassert/releases/tag/v1.3.0) (2015-10-06)


#### Features

  * [Support removal of ES6 import declaration](https://github.com/unassert-js/unassert/pull/3)


### [1.2.1](https://github.com/unassert-js/unassert/releases/tag/v1.2.1) (2015-09-29)


#### Bug Fixes

  * remove assignment if and only if operator is `=` ([f14bcd3e](https://github.com/unassert-js/unassert/commit/f14bcd3efd030d33d27ab48f6c89f2ad059cd476))


## [1.2.0](https://github.com/unassert-js/unassert/releases/tag/v1.2.0) (2015-09-25)


#### Features

  * support removal of assert variable assignment ([82cbeea8](https://github.com/unassert-js/unassert/commit/82cbeea801257e2a776a50996666112d96ef42b4))


## [1.1.0](https://github.com/unassert-js/unassert/releases/tag/v1.1.0) (2015-08-11)


#### Features

  * support removal of CommonJS assert declaration ([1c3dc425](https://github.com/unassert-js/unassert/commit/1c3dc425f93f1d8b3790e1ea909a14ff0a6f076f))
  * support removal of CommonJS power-assert declaration ([5925b38a](https://github.com/unassert-js/unassert/commit/5925b38a351596afab4de2f027fed9dc2ed82602))


## [1.0.0](https://github.com/unassert-js/unassert/releases/tag/v1.0.0) (2015-05-27)


The first release.
