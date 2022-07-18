[![unassert][unassert-banner]][unassert-url]

Encourages [programming with assertions](https://en.wikipedia.org/wiki/Assertion_(software_development)) by providing tools to compile them away.

[![Build Status][ci-image]][ci-url]
[![NPM version][npm-image]][npm-url]
[![Code Style][style-image]][style-url]
[![License][license-image]][license-url]

See: "[unassert - encourage reliable programming by writing assertions in production](http://www.slideshare.net/t_wada/unassert)" -- talk at NodeFest 2015, and "One more thing..." in talk at NodeFest 2016, titled "[From Library to Tool - power-assert as a General Purpose Assertion Enhancement Tool](https://speakerdeck.com/twada/from-library-to-tool-power-assert-as-a-general-purpose-assertion-enhancement-tool)"


#### RELATED MODULES

- [unassertify](https://github.com/unassert-js/unassertify): Browserify transform for unassert
- [babel-plugin-unassert](https://github.com/unassert-js/babel-plugin-unassert): Babel plugin for unassert
- [webpack-unassert-loader](https://github.com/unassert-js/webpack-unassert-loader): Webpack loader for unassert
- [gulp-unassert](https://github.com/unassert-js/gulp-unassert): Gulp plugin for unassert
- [unassert-cli](https://github.com/unassert-js/unassert-cli): CLI for unassert
- [rollup-plugin-unassert](https://gitlab.com/IvanSanchez/rollup-plugin-unassert): RollupJS plugin for unassert

INSTALL
---------------------------------------

```
$ npm install --save-dev unassert
```


API
---------------------------------------

### const modifiedAst = unassert(ast)

| return type                                                   |
|:--------------------------------------------------------------|
| `object` ([ECMAScript AST](https://github.com/estree/estree)) |

Remove assertion calls from `ast` ([ECMAScript AST](https://github.com/estree/estree)). `ast` is manipulated directly so returned `modifiedAst` will be the same instance of `ast`.


### const visitor = unassert.createVisitor(options)

| return type                                                                       |
|:----------------------------------------------------------------------------------|
| `object` (visitor object for [estraverse](https://github.com/estools/estraverse)) |

Create visitor object to be used with `estraverse.replace`. Visitor can be customized by `options`.


#### options

Object for configuration options. passed `options` is `Object.assign`ed with default options. If not passed, default options will be used.


##### options.variables

Target variable names for assertion call removal.

For example,

```js
{
  variables: [
    'assert'
  ],
```

will remove assertion calls such as,

* `assert(value, [message])`
* `assert.ok(value, [message])`
* `assert.equal(actual, expected, [message])`
* `assert.notEqual(actual, expected, [message])`
* `assert.strictEqual(actual, expected, [message])`
* `assert.notStrictEqual(actual, expected, [message])`
* `assert.deepEqual(actual, expected, [message])`
* `assert.notDeepEqual(actual, expected, [message])`
* `assert.deepStrictEqual(actual, expected, [message])`
* `assert.notDeepStrictEqual(actual, expected, [message])`
* `assert.fail([message])`
* `assert.fail(actual, expected, message, operator)`
* `assert.throws(block, [error], [message])`
* `assert.doesNotThrow(block, [message])`
* `assert.rejects(asyncFn, [error], [message])`
* `assert.doesNotReject(asyncFn, [error], [message])`
* `assert.ifError(value)`

in addition, unassert removes `console.assert` calls as well.

* `console.assert(value, [message])`


##### options.modules

Target module names for `require` and `import` call removal.

For example,

```js
{
  modules: [
    'assert'
  ]
```

will remove assert variable declarations such as,

* `const assert = require("assert")`
* `const assert = require("node:assert")`
* `const assert = require("assert").strict`
* `const assert = require("node:assert").strict`
* `import assert from "assert"`
* `import assert from "node:assert"`
* `import * as assert from "assert"`
* `import * as assert from "node:assert"`
* `import {strict as assert} from "assert"`
* `import {strict as assert} from "node:assert"`

and assignments.

* `assert = require("assert")`
* `assert = require("node:assert")`
* `assert = require("assert").strict`
* `assert = require("node:assert").strict`


### const options = unassert.defaultOptions()

Returns default options object for `createVisitor` function. In other words, returns

```js
{
  variables: [
    'assert'
  ],
  modules: [
    'assert',
    'power-assert',
    'node:assert'
  ]
}
```


EXAMPLE
---------------------------------------

For given `math.js` below,

```javascript
const assert = require('assert');

function add (a, b) {
  assert(typeof a === 'number');
  console.assert(!isNaN(a));
  assert.equal(typeof b, 'number');
  assert.ok(!isNaN(b));
  return a + b;
}
```

Apply `unassert` then generate modified code to console.

```javascript
const acorn = require('acorn');
const escodegen = require('escodegen');
const unassert = require('unassert');
const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, 'math.js');

const ast = acorn.parse(fs.readFileSync(filepath));
const modifiedAst = unassert(ast);

console.log(escodegen.generate(modifiedAst));
```

Then you will see assert calls disappear.

```javascript
function add(a, b) {
  return a + b;
}
```

Note: unassert supports removal of [power-assert](https://github.com/power-assert-js/power-assert) declarations (`var assert = require('power-assert');`) too.


OUR SUPPORT POLICY
---------------------------------------

We support Node under maintenance. In other words, we stop supporting old Node version when [their maintenance ends](https://github.com/nodejs/LTS).

This means that any other environment is not supported.

NOTE: If unassert works in any of the unsupported environments, it is purely coincidental and has no bearing on future compatibility. Use at your own risk.


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


CONTRIBUTORS
---------------------------------------
* [Renée Kooi](https://github.com/goto-bus-stop)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/unassert-js/unassert/blob/master/LICENSE) license.


[unassert-url]: https://github.com/unassert-js/unassert
[unassert-banner]: https://raw.githubusercontent.com/unassert-js/unassert-js-logo/master/banner/banner-official-fullcolor.png

[npm-url]: https://npmjs.org/package/unassert
[npm-image]: https://badge.fury.io/js/unassert.svg

[ci-image]: https://github.com/unassert-js/unassert/workflows/Node.js%20CI/badge.svg
[ci-url]: https://github.com/unassert-js/unassert/actions?query=workflow%3A%22Node.js+CI%22

[style-url]: https://github.com/standard/semistandard
[style-image]: https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg

[license-url]: https://github.com/unassert-js/unassert/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg
