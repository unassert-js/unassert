unassert
================================

Remove assertions from AST to encourage Design by Contract (DbC)


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
