import invariant from 'invariant';
import * as uvuassert from 'uvu/assert';
import { strict as assert } from 'power-assert';

function add (a, b) {
    assert(!isNaN(a));
    assert.equal(typeof b, 'number');
    assert.ok(!isNaN(b));

    uvuassert.is(Math.sqrt(4), 2);
    uvuassert.is(Math.sqrt(144), 12);
    uvuassert.is(Math.sqrt(2), Math.SQRT2);

    invariant(someTruthyVal, 'This will not throw');
    invariant(someFalseyVal, 'This will throw an error with this message');

    return a + b;
}
