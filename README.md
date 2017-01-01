[![unassert][unassert-banner]][unassert-url]

Encourages programming with assertions by providing tools to compile them away.

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]

See: "[unassert - encourage reliable programming by writing assertions in production](http://www.slideshare.net/t_wada/unassert)" -- talk at NodeFest 2015, and "One more thing..." in talk at NodeFest 2016, titled "[From Library to Tool - power-assert as a General Purpose Assertion Enhancement Tool](https://speakerdeck.com/twada/from-library-to-tool-power-assert-as-a-general-purpose-assertion-enhancement-tool):


#### RELATED MODULES

- [unassertify](https://github.com/unassert-js/unassertify): Browserify transform for unassert
- [babel-plugin-unassert](https://github.com/unassert-js/babel-plugin-unassert): Babel plugin for unassert
- [webpack-unassert-loader](https://github.com/unassert-js/webpack-unassert-loader): Webpack loader for unassert
- [gulp-unassert](https://github.com/unassert-js/gulp-unassert): Gulp plugin for unassert
- [unassert-cli](https://github.com/unassert-js/unassert-cli): CLI for unassert


INSTALL
---------------------------------------

```
$ npm install --save-dev unassert
```


API
---------------------------------------

### var modifiedAst = unassert(ast)

| return type                                                   |
|:--------------------------------------------------------------|
| `object` ([ECMAScript AST](https://github.com/estree/estree)) |

Remove assertion calls matched to [patterns](https://github.com/unassert-js/unassert#supported-patterns) from `ast` ([ECMAScript AST](https://github.com/estree/estree)). `ast` is manipulated directly so returned `modifiedAst` will be the same instance of `ast`.

Assertion expressions are removed when they match [default patterns](https://github.com/unassert-js/unassert#supported-patterns). In other words, unassert removes assertion calls that are compatible with Node.js standard assert API (and console.assert).


### var visitor = unassert.createVisitor(options)

| return type                                                                       |
|:----------------------------------------------------------------------------------|
| `object` (visitor object for [estraverse](https://github.com/estools/estraverse)) |

Create visitor object to be used with `estraverse.replace`. Visitor can be customized by `options`.


#### options

Object for configuration options. passed `options` is `Object.assign`ed with default options. If not passed, default options will be used.


##### options.assertionPatterns

Target patterns for assertion removal.

If callee name (for example, `assert.equal`) matches exactly and number of arguments is satisfied, then the assertion will be removed. Patterns are handled with [call-matcher](https://github.com/twada/call-matcher). Any arguments enclosed in bracket (for example, `[message]`) means optional parameters. Without bracket means mandatory parameters.


##### options.requirePatterns

Target patterns for `require` call removal. Must be in form of assignments.

For example,

```js
{
    requirePatterns: [
        'assert = require("assert")'
    ],
```

will remove `var assert = require("assert")`, `let assert = require("assert")`, `const assert = require("assert")` and `var assert; assert = require("assert")` as well.


##### options.importPatterns

Target patterns for import declaration removal.

For example,

```js
{
    importPatterns: [
        'import assert from "assert"',
        'import * as assert from "assert"',
        'import assert from "power-assert"',
        'import * as assert from "power-assert"'
    ]
```

### var options = unassert.defaultOptions()

Returns default options object for `createVisitor` function. In other words, returns

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
        'assert = require("assert")',
        'assert = require("power-assert")'
    ],
    importPatterns: [
        'import assert from "assert"',
        'import * as assert from "assert"',
        'import assert from "power-assert"',
        'import * as assert from "power-assert"'
    ]
}
```


EXAMPLE
---------------------------------------

For given `math.js` below,

```javascript
'use strict';

var assert = require('assert');

function add (a, b) {
    console.assert(typeof a === 'number');
    assert(!isNaN(a));
    assert.equal(typeof b, 'number');
    assert.ok(!isNaN(b));
    return a + b;
}
```

Apply `unassert` then generate modified code to console.

```javascript
var acorn = require('acorn');
var escodegen = require('escodegen');
var unassert = require('unassert');
var fs = require('fs');
var path = require('path');
var filepath = path.join(__dirname, 'math.js');

var ast = acorn.parse(fs.readFileSync(filepath));
var modifiedAst = unassert(ast);

console.log(escodegen.generate(modifiedAst));
```

Then you will see assert calls disappear.

```javascript
'use strict';
function add(a, b) {
    return a + b;
}
```

Note: unassert supports removal of [power-assert](https://github.com/power-assert-js/power-assert) declarations (`var assert = require('power-assert');`) too.


SUPPORTED PATTERNS
---------------------------------------

Assertion expressions are removed when they match patterns below. In other words, unassert removes assertion calls that are compatible with Node.js standard [assert](https://nodejs.org/api/assert.html) API (and `console.assert`).

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
* `assert.fail(actual, expected, message, operator)`
* `assert.throws(block, [error], [message])`
* `assert.doesNotThrow(block, [message])`
* `assert.ifError(value)`
* `console.assert(value, [message])`

unassert also removes assert variable declarations,

* `var assert = require("assert")`
* `var assert = require("power-assert")`
* `import assert from "assert"`
* `import assert from "power-assert"`
* `import * as assert from "assert"`
* `import * as assert from "power-assert"`

and assignments.

* `assert = require("assert")`
* `assert = require("power-assert")`


OUR SUPPORT POLICY
---------------------------------------

We support Node under maintenance. In other words, we stop supporting old Node version when [their maintenance ends](https://github.com/nodejs/LTS).

This means that any other environment is not supported.

NOTE: If unassert works in any of the unsupported environments, it is purely coincidental and has no bearing on future compatibility. Use at your own risk.


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/unassert-js/unassert/blob/master/LICENSE) license.


[unassert-url]: https://github.com/unassert-js/unassert
[unassert-banner]: https://raw.githubusercontent.com/unassert-js/unassert-js-logo/master/banner/banner-official-fullcolor.png

[npm-url]: https://npmjs.org/package/unassert
[npm-image]: https://badge.fury.io/js/unassert.svg

[travis-url]: https://travis-ci.org/unassert-js/unassert
[travis-image]: https://secure.travis-ci.org/unassert-js/unassert.svg?branch=master

[depstat-url]: https://gemnasium.com/unassert-js/unassert
[depstat-image]: https://gemnasium.com/unassert-js/unassert.svg

[license-url]: https://github.com/unassert-js/unassert/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg
