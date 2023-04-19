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
- [rollup-plugin-unassert](https://github.com/unassert-js/rollup-plugin-unassert): RollupJS plugin for unassert


INSTALL
---------------------------------------

```
$ npm install --save-dev unassert
```


EXAMPLE
---------------------------------------

For given `math.js` below,

```javascript
const assert = require('node:assert');

function add (a, b) {
  assert(typeof a === 'number');
  console.assert(!isNaN(a));
  assert.equal(typeof b, 'number');
  assert.ok(!isNaN(b));
  return a + b;
}
```

Apply `unassertAst` then generate modified code to console.

via CJS code
```javascript
const { unassertAst } = require('unassert');
const { parse } = require('acorn');
const { generate } = require('escodegen');
const { readFileSync } = require('node:fs');
const { join, dirname } = require('node:path');

const filepath = join(__dirname, 'math.js');
const ast = parse(readFileSync(filepath), { ecmaVersion: '2022' });
const modifiedAst = unassertAst(ast);

console.log(generate(modifiedAst));
```

or via ESM code
```javascript
import { unassertAst } from 'unassert';
import { parse } from 'acorn';
import { generate } from 'escodegen';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const filepath = join(__dirname, 'math.js');
const ast = parse(readFileSync(filepath), { ecmaVersion: '2022' });
const modifiedAst = unassertAst(ast);

console.log(generate(modifiedAst));
```

Then you will see assert calls disappear.

```javascript
function add(a, b) {
  return a + b;
}
```


API
---------------------------------------

unassert package exports three functions. [`unassertAst`](https://github.com/unassert-js/unassert#const-modifiedast--unassertastast-options) is the main function. [`createVisitor`](https://github.com/unassert-js/unassert#const-visitor--createvisitoroptions) and [`defaultOptions`](https://github.com/unassert-js/unassert#const-options--defaultoptions) are for customization.


### const modifiedAst = unassertAst(ast, options)

```javascript
const { unassertAst } = require('unassert')
```

```javascript
import { unassertAst } from 'unassert'
```

| return type                                                   |
|:--------------------------------------------------------------|
| `object` ([ECMAScript AST](https://github.com/estree/estree)) |

Remove assertion calls from `ast` ([ECMAScript AST](https://github.com/estree/estree)). Default behaviour can be customized by `options`. `ast` is manipulated directly so returned `modifiedAst` will be the same instance of `ast`.

#### options

Object for configuration options. passed `options` is `Object.assign`ed with default options. If not passed, default options will be used.

##### options.modules

Target module names for assertion call removal.

For example, the default target modules are as follows.

```javascript
{
  modules: [
    'assert',
    'assert/strict',
    'node:assert',
    'node:assert/strict'
  ]
```

In this case, unassert will remove assert variable declarations such as,

* `import assert from "assert"`
* `import assert from "assert/strict"`
* `import assert from "node:assert"`
* `import assert from "node:assert/strict"`
* `import * as assert from "assert"`
* `import * as assert from "node:assert"`
* `import * as assert from "assert/strict"`
* `import * as assert from "node:assert/strict"`
* `import { strict as assert } from "assert"`
* `import { strict as assert } from "node:assert"`
* `import { default as assert } from "assert"`
* `import { default as assert } from "node:assert"`
* `const assert = require("assert")`
* `const assert = require("node:assert")`
* `const assert = require("assert/strict")`
* `const assert = require("node:assert/strict")`
* `const assert = require("assert").strict`
* `const assert = require("node:assert").strict`
* `const { strict: assert } = require("assert")`
* `const { strict: assert } = require("node:assert")`

and assignments.

* `assert = require("assert")`
* `assert = require("node:assert")`
* `assert = require("assert/strict")`
* `assert = require("node:assert/strict")`
* `assert = require("assert").strict`
* `assert = require("node:assert").strict`

In this default case, unassert will remove assertion calls such as,

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
* `assert.match(string, regexp[, message])`
* `assert.doesNotMatch(string, regexp[, message])`
* `assert.throws(block, [error], [message])`
* `assert.doesNotThrow(block, [message])`
* `await assert.rejects(asyncFn, [error], [message])`
* `await assert.doesNotReject(asyncFn, [error], [message])`
* `assert.fail([message])`
* `assert.fail(actual, expected, message, operator)`
* `assert.ifError(value)`

in addition, unassert removes `console.assert` calls as well.

* `console.assert(value, [message])`


#### Auto Variable Tracking

unassert automatically removes assertion calls based on their imported variable names.

So if import declaration is as follows,

* `import strictAssert, { ok, equal as eq } from 'node:assert/strict';`

unassert removes all `strictAssert`, `ok`, `eq` calls.

Please see [customization example](https://github.com/unassert-js/unassert#example-1) for more details.


### const visitor = createVisitor(options)

```javascript
const { createVisitor } = require('unassert')
```

```javascript
import { createVisitor } from 'unassert'
```

| return type                                                                       |
|:----------------------------------------------------------------------------------|
| `object` (visitor object for [estraverse](https://github.com/estools/estraverse)) |

Create visitor object to be used with `estraverse.replace`. Visitor can be customized by `options`.


### const options = defaultOptions()

```javascript
const { defaultOptions } = require('unassert')
```

```javascript
import { defaultOptions } from 'unassert'
```

Returns default options object for `unassertAst` and `createVisitor` function. In other words, returns

```javascript
{
  modules: [
    'assert',
    'assert/strict',
    'node:assert',
    'node:assert/strict'
  ]
}
```

CUSTOMIZATION
---------------------------------------

You can customize options such as target module names.

```javascript
{
  modules: [
    'node:assert',
    'node:assert/strict',
    'power-assert',
    'invariant',
    'nanoassert',
    'uvu/assert'
  ]
}
```

### example

For given `custom.js` below,

```javascript
import invariant from 'invariant';
import nassert from 'nanoassert';
import * as uvuassert from 'uvu/assert';
import { strict as powerAssert } from 'power-assert';
import { default as looseAssert } from 'node:assert';
import strictAssert, { ok, equal as eq } from 'node:assert/strict';

async function add (a, b) {
  strictAssert(!isNaN(a));
  looseAssert(typeof a === 'number');
  eq(typeof b, 'number');
  ok(!isNaN(b));
  powerAssert(typeof a === typeof b);

  nassert(!isNaN(a));

  uvuassert.is(Math.sqrt(4), 2);
  uvuassert.is(Math.sqrt(144), 12);
  uvuassert.is(Math.sqrt(2), Math.SQRT2);

  invariant(someTruthyVal, 'This will not throw');
  invariant(someFalseyVal, 'This will throw an error with this message');

  await strictAssert.rejects(prms);
  await strictAssert.doesNotReject(prms2);

  return a + b;
}
```

Apply `unassertAst` with customized options then generate modified code to console.

```javascript
import { unassertAst } from 'unassert';
import { parse } from 'acorn';
import { generate } from 'escodegen';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const filepath = join(__dirname, 'custom.js');
const ast = parse(readFileSync(filepath), { ecmaVersion: '2022' });
const modifiedAst = unassertAst(ast, {
  modules: [
    'node:assert',
    'node:assert/strict',
    'power-assert',
    'invariant',
    'nanoassert',
    'uvu/assert'
  ]
});

console.log(generate(modifiedAst));
```

Then you will see all assert calls disappear.

```javascript
async function add(a, b) {
  return a + b;
}
```


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
* [Jordan Harband](https://github.com/ljharb)


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
