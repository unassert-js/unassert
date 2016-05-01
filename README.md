unassert
================================

Encourage reliable programming by writing assertions in production code, and compiling them away from release.

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]

See: "[unassert - encourage reliable programming by writing assertions in production](http://www.slideshare.net/t_wada/unassert)" -- talk at NodeFest 2015.


#### RELATED MODULES

- [unassertify](https://github.com/twada/unassertify): Browserify transform for unassert
- [babel-plugin-unassert](https://github.com/twada/babel-plugin-unassert): Babel plugin for unassert
- [webpack-unassert-loader](https://github.com/zoncoen/webpack-unassert-loader): Webpack loader for unassert
- [gulp-unassert](https://github.com/twada/gulp-unassert): Gulp plugin for unassert
- [unassert-cli](https://github.com/twada/unassert-cli): CLI for unassert


INSTALL
---------------------------------------

```
$ npm install --save-dev unassert
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
var esprima = require('esprima');
var escodegen = require('escodegen');
var unassert = require('unassert');
var fs = require('fs');
var path = require('path');
var filepath = path.join(__dirname, 'math.js');

var ast = esprima.parse(fs.readFileSync(filepath));
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


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/2015-2016) license.


[npm-url]: https://npmjs.org/package/unassert
[npm-image]: https://badge.fury.io/js/unassert.svg

[travis-url]: https://travis-ci.org/twada/unassert
[travis-image]: https://secure.travis-ci.org/twada/unassert.svg?branch=master

[depstat-url]: https://gemnasium.com/twada/unassert
[depstat-image]: https://gemnasium.com/twada/unassert.svg

[license-url]: http://twada.mit-license.org/2015-2016
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg
