import {strict as assert} from 'node:assert';
import invariant from 'invariant';
import nassert from 'nanoassert';
import * as uassert from 'uvu/assert';

function add (a, b) {
    assert(!isNaN(a));
    assert.equal(typeof b, 'number');
    assert.ok(!isNaN(b));

    nassert(!isNaN(a));

    uassert.is(Math.sqrt(4), 2);
    uassert.is(Math.sqrt(144), 12);
    uassert.is(Math.sqrt(2), Math.SQRT2);

    invariant(someTruthyVal, 'This will not throw');
    invariant(someFalseyVal, 'This will throw an error with this message');

    return a + b;
}
