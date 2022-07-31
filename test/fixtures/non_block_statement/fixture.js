'use strict';

var assert = require('assert');

function add (a, b) {
    if (!isNaN(a)) assert(0 < a);
    if (typeof b === 'number') {
        assert(0 < b);
    }

    if (typeof a === 'number')
        assert(0 < a);
    else if (typeof b === 'number')
        assert(0 < b);
    else
        assert(false);

    ensure:
        assert(0 < a);

    for (const i of [a, b])
      assert (0 < i);

    return a + b;
}
