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

    await looseAssert.rejects(prms);
    await strictAssert.doesNotReject(prms2);

    return a + b;
}
