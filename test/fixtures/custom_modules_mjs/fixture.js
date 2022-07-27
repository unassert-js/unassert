import invariant from 'invariant';
import nassert from 'nanoassert';
import * as uvuassert from 'uvu/assert';
import { strict as assert } from 'power-assert';
import nodeassert, { ok, equal as eq } from 'node:assert/strict';

function add (a, b) {
    assert(!isNaN(a));
    nodeassert(typeof a === 'number');
    eq(typeof b, 'number');
    ok(!isNaN(b));

    nassert(!isNaN(a));

    uvuassert.is(Math.sqrt(4), 2);
    uvuassert.is(Math.sqrt(144), 12);
    uvuassert.is(Math.sqrt(2), Math.SQRT2);

    invariant(someTruthyVal, 'This will not throw');
    invariant(someFalseyVal, 'This will throw an error with this message');

    return a + b;
}
