unassert
================================

Remove assertions from AST to encourage Design by Contract (DbC)

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]


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


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.


[npm-url]: https://npmjs.org/package/unassert
[npm-image]: https://badge.fury.io/js/unassert.svg

[travis-url]: http://travis-ci.org/twada/unassert
[travis-image]: https://secure.travis-ci.org/twada/unassert.svg?branch=master

[depstat-url]: https://gemnasium.com/twada/unassert
[depstat-image]: https://gemnasium.com/twada/unassert.svg

[license-url]: http://twada.mit-license.org/
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg
