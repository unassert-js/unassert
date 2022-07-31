'use strict';

const assert = require('node:assert');

async function add (a, b) {
    console.assert(typeof a === 'number');

    assert(!isNaN(a));
    assert(!isNaN(a), 'assertion message');

    assert.ok(!isNaN(b));
    assert.ok(!isNaN(b), 'assertion message');

    assert.equal(typeof b, 'number');
    assert.equal(typeof b, 'number', 'assertion message');

    assert.strictEqual(typeof b, 'number');
    assert.strictEqual(typeof b, 'number', 'assertion message');

    assert.deepEqual(typeof b, 'number');
    assert.deepEqual(typeof b, 'number', 'assertion message');

    assert.deepStrictEqual(typeof b, 'number');
    assert.deepStrictEqual(typeof b, 'number', 'assertion message');

    assert.notEqual(typeof a, 'object');
    assert.notEqual(typeof a, 'object', 'assertion message');

    assert.notStrictEqual(typeof a, 'object');
    assert.notStrictEqual(typeof a, 'object', 'assertion message');

    assert.notDeepEqual(typeof a, 'object');
    assert.notDeepEqual(typeof a, 'object', 'assertion message');

    assert.notDeepStrictEqual(typeof a, 'object');
    assert.notDeepStrictEqual(typeof a, 'object', 'assertion message');

    assert.throws(function () {
        validate(a);
    });
    assert.throws(function () {
        validate(a);
    }, 'assertion message');
    assert.throws(function () {
        validate(a);
    }, Error, 'assertion message');

    assert.doesNotThrow(function () {
        validate(b);
    }, 'assertion message');
    assert.doesNotThrow(function () {
        validate(b);
    });

    assert.ifError(a);
    assert.fail(a, b, 'assertion message', '==');

    await assert.rejects(prms);
    await assert.doesNotReject(prms2);

    return a + b;
}
